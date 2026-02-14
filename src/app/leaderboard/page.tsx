import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLeaderboardData } from '@/lib/actions';

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboardData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold font-headline">
          Daily Leaderboard
        </CardTitle>
        <CardDescription>
          See who's at the top of their game today.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No players yet. Be the first!</TableCell></TableRow>
            ) : (
              leaderboard.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium text-lg">
                    <div className="flex items-center justify-center">
                      {player.rank <= 3 ? (
                        <Trophy
                          className={cn(
                            'h-6 w-6',
                            player.rank === 1 && 'text-yellow-500',
                            player.rank === 2 && 'text-slate-400',
                            player.rank === 3 && 'text-orange-600'
                          )}
                        />
                      ) : (
                        player.rank
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={player.image || ''} />
                        <AvatarFallback>
                          {player.name ? player.name.substring(0, 2).toUpperCase() : <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{player.streak} days</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {player.totalScore}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
