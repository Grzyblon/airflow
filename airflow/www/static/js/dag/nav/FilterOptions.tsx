/*!
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* global moment */

import { Box, Icon, TagLeftIcon } from "@chakra-ui/react";
import { chakraComponents } from "chakra-react-select";
import DagRunTypeIcon from "src/components/RunTypeIcon";

export const OptionComponent = ({ children, ...props }) => (
    <chakraComponents.Option {...props}>
      <Icon
        as={() => <DagRunTypeIcon runType={props.data.value} color="grey" />}
      />
      <Box ml={1}>{children}</Box>
    </chakraComponents.Option>
  );

export const MultiValueContainerComponent = ({ children, ...props }) => (
<chakraComponents.MultiValueContainer {...props}>
    <TagLeftIcon
    as={() => <DagRunTypeIcon runType={props.data.value} color="white" />}
    />
    {children}
</chakraComponents.MultiValueContainer>
);
