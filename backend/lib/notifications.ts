import prisma from './prisma';

/**
 * Create an in-app notification for a user.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'SYSTEM',
  link?: string
) {
  return prisma.notification.create({
    data: { userId, title, message, type, link }
  });
}

/**
 * Notify a student when their application status changes.
 */
export async function notifyStatusChange(
  studentUserId: string,
  opportunityTitle: string,
  newStatus: string
) {
  const statusLabels: Record<string, string> = {
    SHORTLISTED: '🌟 You\'ve been shortlisted',
    ACCEPTED: '🎉 You\'ve been accepted',
    REJECTED: 'Your application was not selected',
    REVIEWING: 'Your application is being reviewed',
  };

  const title = statusLabels[newStatus] || `Application status: ${newStatus}`;
  const message = `Your application for "${opportunityTitle}" has been updated to ${newStatus}.`;

  return createNotification(studentUserId, title, message, 'STATUS_CHANGE');
}

/**
 * Notify an organization when a new application is received.
 */
export async function notifyNewApplication(
  orgUserId: string,
  studentName: string,
  opportunityTitle: string
) {
  return createNotification(
    orgUserId,
    '📥 New Application',
    `${studentName} applied to "${opportunityTitle}".`,
    'NEW_APPLICATION'
  );
}
