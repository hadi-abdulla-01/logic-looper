import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Award, BrainCircuit, Calendar, Flame, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions);
  let userStats = { streak: 0, totalPuzzlesSolved: 0, averageTime: 0 };

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { streak: true, totalPuzzlesSolved: true, averageTime: true }
    });
    if (user) userStats = user;
  }

  const achievements = [
    {
      name: 'Puzzle Pioneer',
      description: 'Solve your first puzzle.',
      icon: Award,
      unlocked: userStats.totalPuzzlesSolved >= 1,
    },
    {
      name: 'Weekly Warrior',
      description: 'Maintain a 7-day streak.',
      icon: Flame,
      unlocked: userStats.streak >= 7,
    },
    {
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak.',
      icon: Calendar,
      unlocked: userStats.streak >= 30,
    },
    {
      name: 'Speed Demon',
      description: 'Maintain an average time under 5 minutes.',
      icon: Zap,
      unlocked: userStats.totalPuzzlesSolved > 0 && userStats.averageTime < 300,
    },
    {
      name: 'Logic Lord',
      description: 'Solve 50 puzzles.',
      icon: BrainCircuit,
      unlocked: userStats.totalPuzzlesSolved >= 50,
    },
    {
      name: 'Perfect Week',
      description: 'Solve a puzzle every day for a full week.',
      icon: Flame,
      unlocked: userStats.streak >= 7,
    },
    {
      name: 'Century Club',
      description: 'Maintain a 100-day streak.',
      icon: Award,
      unlocked: userStats.streak >= 100,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">
          Your Achievements
        </CardTitle>
        <CardDescription>
          Milestones you've reached on your puzzle journey.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {achievements.map((achievement) => (
              <Tooltip key={achievement.name} delayDuration={0}>
                <TooltipTrigger>
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-4 border rounded-lg aspect-square transition-all',
                      achievement.unlocked ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-300' : 'bg-muted/50'
                    )}
                  >
                    <achievement.icon
                      className={cn(
                        'h-12 w-12',
                        achievement.unlocked ? 'text-amber-500' : 'text-muted-foreground'
                      )}
                    />
                    <span className={cn(
                      "text-sm font-semibold text-center",
                      achievement.unlocked ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'
                    )}>
                      {achievement.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{achievement.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
