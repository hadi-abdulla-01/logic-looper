import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    // Adapter removed to handle DB sync manually for better resilience
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (user.email) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email },
                    });

                    if (!existingUser) {
                        await prisma.user.create({
                            data: {
                                email: user.email,
                                name: user.name,
                                image: user.image,
                                streak: 0,
                                totalPuzzlesSolved: 0,
                                totalScore: 0,
                                progressionLevel: 1,
                            },
                        });
                    }
                } catch (error) {
                    console.error("Database sync failed during sign in:", error);
                    return true;
                }
            }
            return true;
        },
        async jwt({ token, user }) {
            const email = user?.email || token.email;

            if (email) {
                try {
                    let dbUser = await prisma.user.findUnique({
                        where: { email },
                        select: {
                            id: true,
                            streak: true,
                            totalPuzzlesSolved: true,
                            totalScore: true,
                            progressionLevel: true,
                        },
                    });

                    if (!dbUser) {
                        // User not in DB (sync failed previously), attempt to create
                        console.log("User missing in DB, attempting recovery creation for:", email);
                        try {
                            const newUser = await prisma.user.create({
                                data: {
                                    email,
                                    name: user?.name || token.name,
                                    image: user?.image || token.picture,
                                    streak: 0,
                                    totalPuzzlesSolved: 0,
                                    totalScore: 0,
                                    progressionLevel: 1,
                                },
                            });
                            // Transform for token usage
                            dbUser = {
                                id: newUser.id,
                                streak: newUser.streak,
                                totalPuzzlesSolved: newUser.totalPuzzlesSolved,
                                totalScore: newUser.totalScore,
                                progressionLevel: newUser.progressionLevel
                            };
                        } catch (createError) {
                            console.error("Failed to recover user creation in JWT:", createError);
                        }
                    }

                    if (dbUser) {
                        token.id = dbUser.id;
                        token.streak = dbUser.streak;
                        token.totalPuzzlesSolved = dbUser.totalPuzzlesSolved;
                        token.totalScore = dbUser.totalScore;
                        token.progressionLevel = dbUser.progressionLevel;
                        token.dbSyncSuccess = true;
                    } else {
                        // Fallback if creation failed
                        token.id = user?.id || token.sub;
                        token.dbSyncSuccess = false;
                        token.streak = 0;
                        token.totalPuzzlesSolved = 0;
                        token.totalScore = 0;
                        token.progressionLevel = 1;
                    }
                } catch (error) {
                    console.error("Failed to fetch user stats via JWT:", error);
                    token.dbSyncSuccess = false;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.streak = (token.streak as number) || 0;
                session.user.totalPuzzlesSolved = (token.totalPuzzlesSolved as number) || 0;
                session.user.totalScore = (token.totalScore as number) || 0;
                session.user.progressionLevel = (token.progressionLevel as number) || 1;
            }
            return session;
        },
    },
    pages: {
        signIn: '/',
        error: '/', // Redirect to home on error
    },
    session: {
        strategy: 'jwt',
    },
    // Enable debug to see more logs
    debug: process.env.NODE_ENV === 'development',
};
