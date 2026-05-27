import { useQueries } from "@tanstack/react-query";
import type { RouterOutputs } from "@repo/trpc/client";

import { trpc } from "~/trpc/client";

export type SubmissionDetail = RouterOutputs["submission"]["getSubmissionById"];

export const useSubmitForm = () => {
    const mutation = trpc.submission.submitForm.useMutation();

    return {
        submitFormAsync: mutation.mutateAsync,
        submitForm: mutation.mutate,
        ...mutation,
    };
};

export const useListSubmissionsForForm = (formId: string | undefined, limit = 25, offset = 0) => {
    const query = trpc.submission.listSubmissionsForForm.useQuery(
        { formId: formId!, limit, offset },
        { enabled: Boolean(formId) },
    );

    return {
        items: query.data?.items ?? [],
        ...query,
    };
};

export const useSubmissionCountForForm = (formId: string | undefined) => {
    const query = trpc.submission.getSubmissionCountForForm.useQuery(
        { formId: formId! },
        { enabled: Boolean(formId) },
    );

    return {
        count: query.data?.count ?? 0,
        ...query,
    };
};

export const useSubmissionById = (id: string | undefined) => {
    return trpc.submission.getSubmissionById.useQuery(
        { id: id! },
        { enabled: Boolean(id), retry: false },
    );
};

export const useTotalSubmissionCount = (formIds: string[]) => {
    const utils = trpc.useUtils();
    const queries = useQueries({
        queries: formIds.map((formId) => ({
            queryKey: [["submission", "getSubmissionCountForForm"], { input: { formId } }] as const,
            queryFn: () => utils.submission.getSubmissionCountForForm.fetch({ formId }),
            enabled: Boolean(formId),
        })),
    });

    const total = queries.reduce((sum, q) => sum + (q.data?.count ?? 0), 0);
    const isLoading = queries.some((q) => q.isLoading);

    return { total, isLoading };
};

/**
 * Fetches lightweight submission rows, then hydrates each with full answers
 * (the list endpoint does not include answer payloads).
 */
export const useSubmissionsWithAnswers = (formId: string | undefined, limit = 25, offset = 0) => {
    const utils = trpc.useUtils();
    const listQuery = useListSubmissionsForForm(formId, limit, offset);

    const detailQueries = useQueries({
        queries: (listQuery.items ?? []).map((item) => ({
            queryKey: [["submission", "getSubmissionById"], { input: { id: item.id } }] as const,
            queryFn: () => utils.submission.getSubmissionById.fetch({ id: item.id }),
            enabled: Boolean(formId) && listQuery.isSuccess,
        })),
    });

    const isLoadingDetails = detailQueries.some((q) => q.isLoading);
    const submissions = detailQueries
        .map((q) => q.data)
        .filter((s): s is SubmissionDetail => Boolean(s));

    return {
        listQuery,
        submissions,
        isLoading: listQuery.isLoading || isLoadingDetails,
        isError: listQuery.isError || detailQueries.some((q) => q.isError),
        refetch: listQuery.refetch,
    };
};

export const useDeleteSubmission = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.submission.deleteSubmission.useMutation({
        onSuccess: async () => {
            await utils.submission.listSubmissionsForForm.invalidate();
            await utils.submission.getSubmissionCountForForm.invalidate();
        },
    });

    return {
        deleteSubmissionAsync: mutation.mutateAsync,
        deleteSubmission: mutation.mutate,
        ...mutation,
    };
};
