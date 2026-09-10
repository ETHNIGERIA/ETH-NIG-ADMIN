export type ProgramKey = 'hackathon' | 'pitch';

/** One program's ticket-tier allowlist for an event. */
export type ProgramAdmission = {
  program: ProgramKey;
  allowedTierIds: string[];
};
