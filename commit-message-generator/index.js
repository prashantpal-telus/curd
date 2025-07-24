#!/usr/bin/env node

/**
 * AI Commit Message Generator
 * 
 * This CLI tool generates conventional commit messages by analyzing git diffs
 * using the OpenAI API. It supports automatic commit generation and follows
 * the conventional commits specification.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const { program } = require('commander');
const simpleGit = require('simple-git');
const { OpenAI } = require('openai');
const git = simpleGit();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generates a commit message using the OpenAI API
 * 
 * @param {string} diff - The git diff to analyze
 * @returns {Promise<string>} The generated commit message
 * @throws {Error} If there's an error generating the commit message
 */
async function generateCommitMessage(diff) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates conventional commit messages based on git diffs. Format should be type(scope): description, where type is one of: feat, fix, docs, style, refactor, perf, test, chore. Keep the message concise and clear."
        },
        {
          role: "user",
          content: `Generate a conventional commit message for this git diff:\n\n${diff}`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message.content.trim();
    } else {
      throw new Error('Unexpected response structure from OpenAI');
    }
  } catch (error) {
    console.error('Error generating commit message:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

/**
 * Main function that handles CLI operations
 * - Parses command line arguments
 * - Gets staged changes
 * - Generates commit message
 * - Optionally commits changes
 */
async function main() {
  try {
    program
      .name('commit-message-generator')
      .description('AI-powered conventional commit message generator')
      .option('-a, --auto-commit', 'Automatically commit with generated message')
      .parse(process.argv);

    const options = program.opts();

    // Get staged changes
    const diff = await git.diff(["--staged"]);

    if (!diff) {
      console.error('No staged changes found. Stage your changes using git add first.');
      process.exit(1);
    }

    // Generate commit message
    const commitMessage = await generateCommitMessage(diff);
    console.log('\nGenerated commit message:');
    console.log(commitMessage);

    // Auto-commit if flag is set
    if (options.autoCommit) {
      await git.commit(commitMessage);
      console.log('\nChanges committed successfully!');
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
