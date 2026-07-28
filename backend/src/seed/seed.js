/**
 * Puts a usable board in the database: one admin, two members, a project and a
 * handful of tasks spread across the three statuses.
 *
 * Run with `npm run seed`. It only clears the accounts and projects it owns, so
 * anything else you have been working on is left alone.
 */
const { TASK_STATUSES, TASK_PRIORITIES, ROLES } = require('../constants');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const Project = require('../models/project.model');
const Task = require('../models/task.model');
const User = require('../models/user.model');

const PROJECT_NAME = 'Website Relaunch';

const PEOPLE = [
  { name: 'Amina Hassan', email: 'admin@taskboard.dev', password: 'Admin1234', role: ROLES.ADMIN },
  { name: 'Omar Farouk', email: 'member@taskboard.dev', password: 'Member1234', role: ROLES.MEMBER },
  { name: 'Layla Saeed', email: 'layla@taskboard.dev', password: 'Member1234', role: ROLES.MEMBER },
];

const TASKS = [
  {
    title: 'Design the new landing page',
    description: 'Hero section, pricing table and the footer.',
    status: TASK_STATUSES.DONE,
    priority: TASK_PRIORITIES.HIGH,
    assigneeEmail: 'member@taskboard.dev',
    dueInDays: -3,
  },
  {
    title: 'Migrate the blog content',
    description: 'Around 40 posts, images included.',
    status: TASK_STATUSES.IN_PROGRESS,
    priority: TASK_PRIORITIES.MEDIUM,
    assigneeEmail: 'layla@taskboard.dev',
    dueInDays: 2,
  },
  {
    title: 'Set up the staging environment',
    description: 'Same docker compose file, different env vars.',
    status: TASK_STATUSES.IN_PROGRESS,
    priority: TASK_PRIORITIES.HIGH,
    assigneeEmail: 'member@taskboard.dev',
    dueInDays: 5,
  },
  {
    title: 'Write the release notes',
    description: '',
    status: TASK_STATUSES.TODO,
    priority: TASK_PRIORITIES.LOW,
    assigneeEmail: null,
    dueInDays: 10,
  },
  {
    title: 'Fix the mobile navigation',
    description: 'The menu stays open after tapping a link.',
    status: TASK_STATUSES.TODO,
    priority: TASK_PRIORITIES.HIGH,
    assigneeEmail: 'layla@taskboard.dev',
    dueInDays: 1,
  },
];

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function seed() {
  await connectDatabase();

  const emails = PEOPLE.map((person) => person.email);

  // Start from a known state so the script can be run over and over.
  const previousProjects = await Project.find({ name: PROJECT_NAME }).select('_id');
  await Task.deleteMany({ project: { $in: previousProjects.map((project) => project._id) } });
  await Project.deleteMany({ name: PROJECT_NAME });
  await User.deleteMany({ email: { $in: emails } });

  // create() rather than insertMany() so the password hashing hook runs.
  const users = await Promise.all(PEOPLE.map((person) => User.create(person)));
  const byEmail = new Map(users.map((user) => [user.email, user]));

  const admin = byEmail.get('admin@taskboard.dev');

  const project = await Project.create({
    name: PROJECT_NAME,
    description: 'Rebuild the marketing site before the end of the quarter.',
    owner: admin._id,
    members: users.map((user) => user._id),
  });

  await Promise.all(
    TASKS.map(({ assigneeEmail, dueInDays, ...task }) =>
      Task.create({
        ...task,
        project: project._id,
        creator: admin._id,
        assignee: assigneeEmail ? byEmail.get(assigneeEmail)._id : null,
        dueDate: daysFromNow(dueInDays),
      })
    )
  );

  console.log(`Seeded "${project.name}" with ${TASKS.length} tasks.\n`);
  console.log('Sign in with:');
  PEOPLE.forEach((person) => {
    console.log(`  ${person.role.padEnd(6)} ${person.email}  /  ${person.password}`);
  });

  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error('Seeding failed:', error.message);
  await disconnectDatabase();
  process.exit(1);
});
