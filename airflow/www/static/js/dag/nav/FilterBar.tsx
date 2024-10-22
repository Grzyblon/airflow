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

import { Box, Button, Flex, Icon, Select, TagLeftIcon } from "@chakra-ui/react";
import MultiSelect from "src/components/MultiSelect";
import React from "react";
import type { DagRun, RunState, TaskState } from "src/types";
import AutoRefresh from "src/components/AutoRefresh";
import type {
  GroupBase,
  OptionBase,
  SelectComponentsConfig,
  Size,
} from "chakra-react-select";
import { chakraComponents, useChakraSelectProps } from "chakra-react-select";

import { useTimezone } from "src/context/timezone";
import { isoFormatWithoutTZ } from "src/datetime_utils";
import useFilters from "src/dag/useFilters";
import DateTimeInput from "src/components/DateTimeInput";
import { MdInfo, MdOutlineSchedule, MdPlayArrow } from "react-icons/md";
import { RiArrowGoBackFill } from "react-icons/ri";
import { HiDatabase } from "react-icons/hi";
import { IconType } from "react-icons";

declare const filtersOptions: {
  dagStates: RunState[];
  numRuns: number[];
  runTypes: DagRun["runType"][];
  taskStates: TaskState[];
};

const now = new Date();

const FilterBar = () => {
  const {
    filters: {
      baseDate,
      numRuns,
      runState,
      runStateOptions,
      runType,
      runTypeOptions,
    },
    onBaseDateChange,
    onNumRunsChange,
    onRunTypeChange,
    onRunStateChange,
    clearFilters,
    transformArrayToMultiSelectOptions,
  } = useFilters();

  // @ts-ignore
  const isBaseDateDefault = moment(now).isSame(baseDate, "minute");
  const isRunStateDefault = !runState || !runState.length;
  const isRunTypeDefault = !runType || !runType.length;
  const areFiltersDefault =
    isBaseDateDefault && isRunTypeDefault && isRunStateDefault;

  const { timezone } = useTimezone();
  // @ts-ignore
  const time = moment(baseDate);
  // @ts-ignore
  const formattedTime = time.tz(timezone).format(isoFormatWithoutTZ);

  const inputStyles: { backgroundColor: string; size: Size } = {
    backgroundColor: "white",
    size: "lg",
  };

  const multiSelectBoxStyle = { minWidth: "160px", zIndex: 3 };

  const multiSelectStyles: Record<string, any> = {
    size: "lg",
    isMulti: true,
    tagVariant: "solid",
    hideSelectedOptions: false,
    isClearable: false,
    selectedOptionStyle: "check",
  };

  const filteredStyles = {
    borderColor: "blue.400",
    borderWidth: 2,
  };

  const runTypeStyles = useChakraSelectProps({
    ...multiSelectStyles,
    chakraStyles: {
      control: (provided) => ({
        ...provided,
        bg: "white",
        ...(isRunTypeDefault ? {} : filteredStyles),
        _hover: {
          ...(isRunTypeDefault ? {} : filteredStyles),
        },
      }),
    },
  });

  const runStateStyles = useChakraSelectProps({
    ...multiSelectStyles,
    chakraStyles: {
      control: (provided) => ({
        ...provided,
        bg: "white",
        ...(isRunStateDefault ? {} : filteredStyles),
        _hover: {
          ...(isRunStateDefault ? {} : filteredStyles),
        },
      }),
    },
  });

  interface RunTypesOption extends OptionBase {
    label: string;
    value: string;
    icon: IconType;
    // iconColor: string;
  }

  const customComponents: SelectComponentsConfig<
    RunTypesOption,
    true,
    GroupBase<RunTypesOption>
  > = {
    Option: ({ children, ...props }) => (
      <chakraComponents.Option {...props}>
        <Icon as={props.data.icon} color="gray" mr={2} h={5} w={5} />
        {children}
      </chakraComponents.Option>
    ),
    MultiValueContainer: ({ children, ...props }) => (
      <chakraComponents.MultiValueContainer {...props}>
        <TagLeftIcon as={props.data.icon} color="white" />
        {children}
      </chakraComponents.MultiValueContainer>
    ),
  };

  const getIcon = (runType: string): IconType => {
    switch (runType) {
      case "manual":
        return MdPlayArrow;
      case "backfill":
        return RiArrowGoBackFill;
      case "scheduled":
        return MdOutlineSchedule;
      case "dataset_triggered":
        return HiDatabase;
      default:
        return MdInfo;
    }
  };

  const transformRunTypesToMultiSelectOptions = (
    options: string[] | null
  ): { label: string; value: string; icon: IconType }[] =>
    options === null
      ? []
      : options.map((option) => ({
          label: option,
          value: option,
          icon: getIcon(option),
        }));

  return (
    <Flex backgroundColor="blackAlpha.200" p={4} justifyContent="space-between">
      <Flex>
        <Box px={2}>
          <DateTimeInput
            {...inputStyles}
            value={formattedTime || ""}
            onChange={(e) => onBaseDateChange(e.target.value)}
            {...(isBaseDateDefault ? {} : filteredStyles)}
          />
        </Box>
        <Box px={2} style={multiSelectBoxStyle}>
          <MultiSelect
            {...runTypeStyles}
            value={transformRunTypesToMultiSelectOptions(runType)}
            onChange={(typeOptions) => {
              if (
                Array.isArray(typeOptions) &&
                typeOptions.every((typeOption) => "value" in typeOption)
              ) {
                onRunTypeChange(
                  typeOptions.map((typeOption) => typeOption.value)
                );
              }
            }}
            options={transformArrayToMultiSelectOptions(runTypeOptions)}
            components={customComponents}
            placeholder="All Run Types"
          />
        </Box>
        <Box />
        <Box px={2} style={multiSelectBoxStyle}>
          <MultiSelect
            {...runStateStyles}
            value={transformArrayToMultiSelectOptions(runState)}
            onChange={(stateOptions) => {
              if (
                Array.isArray(stateOptions) &&
                stateOptions.every((stateOption) => "value" in stateOption)
              ) {
                onRunStateChange(
                  stateOptions.map((stateOption) => stateOption.value)
                );
              }
            }}
            options={transformArrayToMultiSelectOptions(runStateOptions)}
            placeholder="All Run States"
          />
        </Box>
        <Box px={2}>
          <Button
            colorScheme="cyan"
            aria-label="Reset filters"
            background="white"
            variant="outline"
            onClick={clearFilters}
            disabled={areFiltersDefault}
            size="lg"
          >
            Clear Filters
          </Button>
        </Box>
      </Flex>
      <Flex>
        <AutoRefresh />
        <Box px={2}>
          <Select
            {...inputStyles}
            placeholder="Runs"
            value={numRuns || ""}
            onChange={(e) => onNumRunsChange(e.target.value)}
            aria-label="Number of runs to display in grid"
          >
            {filtersOptions.numRuns.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </Select>
        </Box>
      </Flex>
    </Flex>
  );
};

export default FilterBar;
