export default function getErrorMessage(error: unknown): Error | string {
    if (error instanceof Error) return error.message;
    return String(error);
}