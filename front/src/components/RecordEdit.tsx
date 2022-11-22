import { Box, Center, HStack, IconButton, Spinner, Stack, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { addDays, format, startOfTomorrow, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';

import { getDailyRecord } from '@/lib/backend';

const toDate = (dateTime: Date) => format(dateTime, 'yyyy-MM-dd');

export const RecordEdit = () => {
  const [recordedAt, setRecordedAt] = useState(new Date());
  const toPreviousDay = () => setRecordedAt((prev) => subDays(prev, 1));
  const toNextDay = () => setRecordedAt((prev) => addDays(prev, 1));
  const canToNextDay = addDays(recordedAt, 1) < startOfTomorrow();

  const recordedOn = useMemo(() => toDate(recordedAt), [recordedAt]);
  const dailyRecord = useQuery({
    queryKey: ['dailyRecord', recordedOn],
    queryFn: () => getDailyRecord(recordedOn),
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
          disabled={!canToNextDay}
        />
      </HStack>

      <VStack>
        {dailyRecord.isLoading && (
          <Center>
            <Spinner />
          </Center>
        )}
        {dailyRecord.data?.habitDailyRecords.map((habitDailyRecord) => (
          <Box key={habitDailyRecord.id}>{habitDailyRecord.name}</Box>
        ))}
      </VStack>
    </Stack>
  );
};
