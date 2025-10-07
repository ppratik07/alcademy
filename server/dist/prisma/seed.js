import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
    // Subjects
    const maths = await prisma.subject.create({
        data: {
            name: "Mathematics",
            description: "NSW Grade 4 Mathematics",
            gradeLevel: "4",
            chapters: {
                create: [
                    {
                        name: "Number and Algebra",
                        topics: {
                            create: [
                                {
                                    name: "Addition and Subtraction",
                                    lessons: {
                                        create: [
                                            {
                                                title: "Adding 3-digit Numbers",
                                                content: "Learn how to add 3-digit numbers with and without regrouping.",
                                            },
                                            {
                                                title: "Subtracting 3-digit Numbers",
                                                content: "Learn how to subtract 3-digit numbers with and without regrouping.",
                                            },
                                        ],
                                    },
                                },
                                {
                                    name: "Multiplication and Division",
                                    lessons: {
                                        create: [
                                            {
                                                title: "Multiplying by 2-digit Numbers",
                                                content: "Learn multiplication strategies for 2-digit numbers.",
                                            },
                                            {
                                                title: "Division with Remainders",
                                                content: "Learn how to divide numbers and interpret remainders.",
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    {
                        name: "Measurement and Geometry",
                        topics: {
                            create: [
                                {
                                    name: "Length and Area",
                                    lessons: {
                                        create: [
                                            {
                                                title: "Measuring Length",
                                                content: "Understand units of length and how to measure objects.",
                                            },
                                            {
                                                title: "Calculating Area",
                                                content: "Learn to calculate area of rectangles and squares.",
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });
    const science = await prisma.subject.create({
        data: {
            name: "Science",
            description: "NSW Grade 4 Science",
            gradeLevel: "4",
            chapters: {
                create: [
                    {
                        name: "Physical World",
                        topics: {
                            create: [
                                {
                                    name: "Forces",
                                    lessons: {
                                        create: [
                                            {
                                                title: "Push and Pull",
                                                content: "Explore how forces can move objects.",
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                    {
                        name: "Living World",
                        topics: {
                            create: [
                                {
                                    name: "Life Cycles",
                                    lessons: {
                                        create: [
                                            {
                                                title: "Plant Life Cycles",
                                                content: "Learn about the stages in a plant's life.",
                                            },
                                            {
                                                title: "Animal Life Cycles",
                                                content: "Discover how animals grow and change.",
                                            },
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
    });
    console.log("Seed data created:", { maths, science });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
