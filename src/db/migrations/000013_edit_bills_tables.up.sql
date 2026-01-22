CREATE TYPE bill_status AS ENUM (
    'unassigned',
    'introduced',
    'scheduled1',
    'deferred1',
    'waiting2',
    'scheduled2',
    'deferred2',
    'waiting3',
    'scheduled3',
    'deferred3',
    'crossoverWaiting1',
    'crossoverScheduled1',
    'crossoverDeferred1',
    'crossoverWaiting2',
    'crossoverScheduled2',
    'crossoverDeferred2',
    'crossoverWaiting3',
    'crossoverScheduled3',
    'crossoverDeferred3',
    'passedCommittees',
    'conferenceAssigned',
    'conferenceScheduled',
    'conferenceDeferred',
    'conferencePassed',
    'transmittedGovernor',
    'vetoList',
    'governorSigns',
    'lawWithoutSignature'
);

ALTER TABLE bills
  ADD COLUMN year integer,
  ADD CONSTRAINT bills_bill_number_year_key UNIQUE (bill_number, year);

ALTER TABLE bills
  ALTER COLUMN current_status DROP DEFAULT;

UPDATE bills
SET current_status = 'unassigned'
WHERE current_status IS NULL OR current_status = '';

ALTER TABLE bills
  ALTER COLUMN current_status TYPE bill_status
  USING (
    CASE
      WHEN current_status IS NULL OR current_status = '' THEN 'unassigned'
      ELSE current_status
    END
  )::bill_status,
  ALTER COLUMN current_status SET DEFAULT 'unassigned';

ALTER TABLE bills
  RENAME COLUMN current_status TO bill_status;

