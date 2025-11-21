import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getAllUsers() {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true
        }
    });
}