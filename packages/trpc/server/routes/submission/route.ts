import { authenticatedProcedure, optionallyAuthenticatedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { submissionService } from "../../services";
import { toPublicTRPCError } from "../../utils/public-error";
import {
    deleteSubmissionInputModel,
    deleteSubmissionOutputModel,
    getSubmissionByIdInputModel,
    getSubmissionByIdOutputModel,
    getSubmissionCountForFormInputModel,
    getSubmissionCountForFormOutputModel,
    listSubmissionsForFormInputModel,
    listSubmissionsForFormOutputModel,
    submitFormInputModel,
    submitFormOutputModel,
} from "./model";

const TAGS = ["Submissions"];
const getPath = generatePath("/submissions");

export const submissionRouter = router({
    submitForm: optionallyAuthenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/submitForm"),
                tags: TAGS,
            },
        })
        .input(submitFormInputModel)
        .output(submitFormOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await submissionService.submitForm(input, {
                    submitterId: ctx.user?.id ?? null,
                    ipAddress: ctx.ipAddress,
                    userAgent: ctx.userAgent,
                });
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while submitting the form.", {
                    path: "submission.submitForm",
                });
            }
        }),

    getSubmissionById: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getSubmissionById"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(getSubmissionByIdInputModel)
        .output(getSubmissionByIdOutputModel)
        .query(async ({ input, ctx }) => {
            try {
                return await submissionService.getSubmissionById(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while loading the response.", {
                    path: "submission.getSubmissionById",
                });
            }
        }),

    listSubmissionsForForm: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/listSubmissionsForForm"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(listSubmissionsForFormInputModel)
        .output(listSubmissionsForFormOutputModel)
        .query(async ({ input, ctx }) => {
            try {
                const items = await submissionService.listSubmissionsForForm(ctx.user.id, input);
                return { items };
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while loading responses.", {
                    path: "submission.listSubmissionsForForm",
                });
            }
        }),

    getSubmissionCountForForm: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getSubmissionCountForForm"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(getSubmissionCountForFormInputModel)
        .output(getSubmissionCountForFormOutputModel)
        .query(async ({ input, ctx }) => {
            try {
                return await submissionService.getSubmissionCountForForm(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "Something went wrong while loading response counts.",
                    {
                        path: "submission.getSubmissionCountForForm",
                    },
                );
            }
        }),

    deleteSubmission: authenticatedProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/deleteSubmission"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(deleteSubmissionInputModel)
        .output(deleteSubmissionOutputModel)
        .mutation(async ({ input, ctx }) => {
            try {
                return await submissionService.deleteSubmission(ctx.user.id, input);
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "Something went wrong while deleting the response.",
                    {
                        path: "submission.deleteSubmission",
                    },
                );
            }
        }),
});
