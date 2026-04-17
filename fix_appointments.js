const fs = require('fs');
let code = fs.readFileSync('src/lib/actions/appointments.server.ts', 'utf8');

const regex = /export async function checkInAppointment[\s\S]*?return \{ success: false, error: 'Failed to check in appointment' \};\r?\n  \}\r?\n\}/;

const cleanCheckInAppointment = `export async function checkInAppointment(id: string) {
  try {
    const result = await updateAppointmentStatus(id, { status: 'CONFIRMED' });
    if (!result.success) {
      return result;
    }
    revalidateCache('appointments');
    revalidateCache('queue');
    return { success: true };
  } catch (error) {
    logger.error('Failed to check in appointment', error instanceof Error ? error : new Error(String(error)));
    return { success: false, error: 'Failed to check in appointment' };
  }
}`;

if (regex.test(code)) {
  code = code.replace(regex, cleanCheckInAppointment);
  fs.writeFileSync('src/lib/actions/appointments.server.ts', code);
  console.log('Successfully replaced checkInAppointment');
} else {
  console.log('Could not find checkInAppointment to replace');
}
