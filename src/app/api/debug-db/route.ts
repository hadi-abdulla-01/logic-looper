import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const report: any = { step: 'init' };
    try {
        // 1. Test Connection & Count
        report.step = 'counting_users';
        const count = await prisma.user.count();
        report.userCount = count;
        report.connection = 'OK';

        // 2. Test Write (Creation)
        report.step = 'creating_test_user';
        const testEmail = `debug_${Date.now()}@example.com`;
        const newUser = await prisma.user.create({
            data: {
                email: testEmail,
                name: 'Debug Test User',
                image: 'https://example.com/avatar.png',
                streak: 0,
                totalPuzzlesSolved: 0,
                totalScore: 0,
                progressionLevel: 1,
            },
        });
        report.createdUser = newUser;
        report.writeTest = 'OK';

        // 3. Test Cleanup (Delete)
        report.step = 'deleting_test_user';
        await prisma.user.delete({
            where: { id: newUser.id },
        });
        report.cleanup = 'OK';

        return NextResponse.json({
            status: 'Success',
            message: 'Database connection and write operations are working.',
            report
        });

    } catch (error: any) {
        console.error('Debug DB Error:', error);
        return NextResponse.json({
            status: 'Error',
            stepFailed: report.step,
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            report
        }, { status: 500 });
    }
}
