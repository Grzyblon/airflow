# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing_extensions import Annotated

from airflow.api_fastapi.common.db.common import get_session, paginated_select
from airflow.api_fastapi.common.parameters import QueryLimit, QueryOffset, SortParam
from airflow.api_fastapi.common.router import AirflowRouter
from airflow.api_fastapi.core_api.openapi.exceptions import create_openapi_http_exception_doc
from airflow.api_fastapi.core_api.serializers.connections import (
    ConnectionBody,
    ConnectionCollectionResponse,
    ConnectionResponse,
)
from airflow.models import Connection
from airflow.utils import helpers

connections_router = AirflowRouter(tags=["Connection"], prefix="/connections")


@connections_router.delete(
    "/{connection_id}",
    status_code=204,
    responses=create_openapi_http_exception_doc(
        [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    ),
)
async def delete_connection(
    connection_id: str,
    session: Annotated[Session, Depends(get_session)],
):
    """Delete a connection entry."""
    connection = session.scalar(select(Connection).filter_by(conn_id=connection_id))

    if connection is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"The Connection with connection_id: `{connection_id}` was not found"
        )

    session.delete(connection)


@connections_router.get(
    "/{connection_id}",
    responses=create_openapi_http_exception_doc(
        [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    ),
)
async def get_connection(
    connection_id: str,
    session: Annotated[Session, Depends(get_session)],
) -> ConnectionResponse:
    """Get a connection entry."""
    connection = session.scalar(select(Connection).filter_by(conn_id=connection_id))

    if connection is None:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, f"The Connection with connection_id: `{connection_id}` was not found"
        )

    return ConnectionResponse.model_validate(connection, from_attributes=True)


@connections_router.get(
    "/",
    responses=create_openapi_http_exception_doc(
        [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]
    ),
)
async def get_connections(
    limit: QueryLimit,
    offset: QueryOffset,
    order_by: Annotated[
        SortParam,
        Depends(
            SortParam(
                ["connection_id", "conn_type", "description", "host", "port", "id"], Connection
            ).dynamic_depends()
        ),
    ],
    session: Annotated[Session, Depends(get_session)],
) -> ConnectionCollectionResponse:
    """Get all connection entries."""
    connection_select, total_entries = paginated_select(
        select(Connection),
        [],
        order_by=order_by,
        offset=offset,
        limit=limit,
        session=session,
    )

    connections = session.scalars(connection_select).all()

    return ConnectionCollectionResponse(
        connections=[
            ConnectionResponse.model_validate(connection, from_attributes=True) for connection in connections
        ],
        total_entries=total_entries,
    )


@connections_router.post("/", status_code=201, responses=create_openapi_http_exception_doc([401, 403, 409]))
async def post_connection(
    post_body: ConnectionBody,
    session: Annotated[Session, Depends(get_session)],
) -> ConnectionResponse:
    """Create connection entry."""
    try:
        helpers.validate_key(post_body.connection_id, max_length=200)
    except Exception as e:
        raise HTTPException(400, f"{e}")

    connection = session.scalar(select(Connection).filter_by(conn_id=post_body.connection_id))
    if connection is not None:
        raise HTTPException(409, f"Connection with connection_id: `{post_body.connection_id}` already exists")

    connection = Connection(**post_body.model_dump(by_alias=True))
    session.add(connection)

    return ConnectionResponse.model_validate(connection, from_attributes=True)
