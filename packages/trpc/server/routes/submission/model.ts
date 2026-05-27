import { z } from "zod";

import {
    deleteSubmissionInput,
    getSubmissionByIdInput,
    getSubmissionCountForFormInput,
    listSubmissionsForFormInput,
    submitFormInput,
} from "@repo/services/submission/model";

// Inputs are identical to the service contracts (the service is the source of
// truth). Re-exported with the `…InputModel` naming convention used elsewhere
// in the trpc layer. All are plain ZodObjects so `trpc-to-openapi`'s internal
// `.omit()` works.
export const submitFormInputModel = submitFormInput;
export const getSubmissionByIdInputModel = getSubmissionByIdInput;
export const listSubmissionsForFormInputModel = listSubmissionsForFormInput;
export const getSubmissionCountForFormInputModel = getSubmissionCountForFormInput;
export const deleteSubmissionInputModel = deleteSubmissionInput;

// Outputs.
export const submitFormOutputModel = z.object({
    id: z.uuid().describe("ID of the created submission"),
    submittedAt: z.date().describe("Server time the submission was recorded"),
});

const submissionAnswerOutputModel = z.object({
    id: z.uuid(),
    formFieldId: z.uuid(),
    value: z.unknown().describe("Answer payload; shape depends on the field type"),
});

export const getSubmissionByIdOutputModel = z.object({
    id: z.uuid(),
    formId: z.uuid(),
    submitterId: z.uuid().nullable().describe("Null when the form was submitted anonymously"),
    submittedAt: z.date(),
    answers: z.array(submissionAnswerOutputModel).describe("Answers in display order"),
});

export const listSubmissionsForFormOutputModel = z.object({
    items: z.array(
        z.object({
            id: z.uuid(),
            submitterId: z.uuid().nullable(),
            submittedAt: z.date(),
        }),
    ),
});

export const getSubmissionCountForFormOutputModel = z.object({
    count: z.number().int().nonnegative(),
});

export const deleteSubmissionOutputModel = z.object({
    id: z.uuid(),
});
