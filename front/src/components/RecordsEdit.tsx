import {
  Box,
  Button,
  Center,
  Checkbox,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  useCheckboxGroup,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays, format, isToday, subDays } from 'date-fns';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';
import { useNavigate } from 'react-router-dom';

import { useAppToast } from '@/hooks/useAppToast';
import { useTextInput } from '@/hooks/useTextInput';
import {
  DailyRecord,
  getDailyRecord,
  updateDailyRecord as updateDailyRecordFn,
} from '@/lib/backend';

const toDate = (dateTime: Date) => format(dateTime, 'yyyy-MM-dd');

export const RecordsEdit = () => {
  const [recordedAt, setRecordedAt] = useState(new Date());
  const toPreviousDay = () => setRecordedAt((prev) => subDays(prev, 1));
  const toNextDay = () => setRecordedAt((prev) => addDays(prev, 1));

  const recordedOn = useMemo(() => toDate(recordedAt), [recordedAt]);
  const dailyRecord = useQuery({
    queryKey: ['dailyRecord', recordedOn],
    queryFn: () => getDailyRecord({ recordedOn, tz: 'Asia/Tokyo' }),
  });

  return (
    <Stack>
      <HStack alignSelf="center" spacing="8">
        <IconButton
          aria-label="to previous day"
          icon={<GoChevronLeft />}
          size="xs"
          onClick={toPreviousDay}
        />
        <Box>{recordedOn}</Box>
        <IconButton
          aria-label="to next day"
          icon={<GoChevronRight />}
          size="xs"
          onClick={toNextDay}
          disabled={isToday(recordedAt)}
        />
      </HStack>

      <Stack px="2">
        {dailyRecord.isLoading && (
          <Center py="2">
            <Spinner />
          </Center>
        )}

        {dailyRecord.data && <RecordEditForm dailyRecord={dailyRecord.data} />}

        {dailyRecord.isSuccess && !dailyRecord.data && (
          <Box alignSelf="center">there are/were no active habits.</Box>
        )}
      </Stack>
    </Stack>
  );
};

const RecordEditForm = ({ dailyRecord }: { dailyRecord: DailyRecord }) => {
  const client = useQueryClient();
  const navigate = useNavigate();
  const toast = useAppToast();

  const updateDailyRecord = useMutation({
    mutationFn: updateDailyRecordFn,
    onSuccess: () => {
      client.invalidateQueries(['dailyRecord']);
      toast({ status: 'success', title: 'Updated.' });
      navigate('/');
    },
    onError: () => toast({ status: 'error', title: 'Failed.' }),
  });

  const { value, setValue, getCheckboxProps } = useCheckboxGroup();
  const commentInput = useTextInput();

  useEffect(() => {
    setValue(dailyRecord.habitDailyRecords.filter((v) => v.done).map((v) => v.habitId));
    commentInput.set(dailyRecord.comment);
  }, [dailyRecord]);

  const onSubmit: FormEventHandler = async (e) => {
    e.preventDefault();

    await updateDailyRecord.mutate({
      recordedOn: dailyRecord.recordedOn,
      comment: commentInput.value,
      habitDailyRecords: dailyRecord.habitDailyRecords.map((v) => ({
        done: value.includes(v.habitId),
        habitId: v.habitId,
      })),
    });
  };

  return (
    <Stack as="form" onSubmit={onSubmit}>
      <TableContainer>
        <Table>
          <Tbody>
            {dailyRecord.habitDailyRecords.map((v) => (
              <Tr key={v.habitId}>
                <Td borderColor="transparent">
                  <Checkbox
                    key={v.habitId}
                    {...getCheckboxProps({ value: v.habitId })}
                    colorScheme="joy"
                  >
                    <Box color={v.archived ? 'gray.400' : 'black'}>{v.habitName}</Box>
                  </Checkbox>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>

      <Box px="2">
        <Button w="full" type="submit">
          Save
        </Button>
      </Box>
    </Stack>
  );
};
