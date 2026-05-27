import { z } from "zod";

const answerInput = z.object({
    fieldId: z.uuid().describe("ID of the field being answered"),
    // We accept `unknown` here because the JSON shape depends on the field's
    // type. The service layer validates the value against the field type:
    //   string for SHORT_TEXT/LONG_TEXT/EMAIL/PASSWORD
    //   number for NUMBER/RATING
    //   boolean for YES_NO
    //   option uuid for SINGLE_CHOICE
    //   option uuid[] for MULTI_CHOICE
    value: z.unknown().describe("Answer payload; shape depends on the field type"),
});
export type AnswerInputType = z.infer<typeof answerInput>;

export const submitFormInput = z.object({
    formId: z.uuid().describe("ID of the form being submitted"),
    password: z
        .string()
        .max(128)
        .optional()
        .describe("Shared-secret password for password-protected forms"),
    answers: z
        .array(answerInput)
        .max(200, "A form can have at most 200 fields")
        .describe("One entry per field the respondent answered"),
});
export type SubmitFormInputType = z.infer<typeof submitFormInput>;

export const getSubmissionByIdInput = z.object({
    id: z.uuid().describe("ID of the submission"),
});
export type GetSubmissionByIdInputType = z.infer<typeof getSubmissionByIdInput>;

export const listSubmissionsForFormInput = z.object({
    formId: z.uuid().describe("ID of the form whose submissions to list"),
    limit: z.number().int().min(1).max(100).default(25),
    offset: z.number().int().min(0).default(0),
});
export type ListSubmissionsForFormInputType = z.infer<typeof listSubmissionsForFormInput>;

export const getSubmissionCountForFormInput = z.object({
    formId: z.uuid().describe("ID of the form whose submissions to count"),
});
export type GetSubmissionCountForFormInputType = z.infer<typeof getSubmissionCountForFormInput>;

export const deleteSubmissionInput = z.object({
    id: z.uuid().describe("ID of the submission to delete"),
});
export type DeleteSubmissionInputType = z.infer<typeof deleteSubmissionInput>;
