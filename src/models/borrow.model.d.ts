export function checkDueOrOverdue(user_id: string): Promise<{ alldues: any[], overdue: any[] }>;
export function getBorrowedCountForBook(book_uuid: string): Promise<number>;
export function borrowTransaction(newBorrowings: any[]): Promise<any[]>;
