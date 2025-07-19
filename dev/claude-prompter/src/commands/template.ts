import { Command } from 'commander';
import { TemplateManager } from '../data/TemplateManager';
import { TemplateVariable } from '../types/template.types';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import * as fs from 'fs';

export function createTemplateCommand(): Command {
  const template = new Command('template');
  template.description('Manage prompt templates for reusable patterns');

  const templateManager = new TemplateManager();

  // List templates
  template
    .command('list')
    .description('List all available templates')
    .option('-c, --category <category>', 'Filter by category')
    .action(async (options) => {
      const spinner = ora('Loading templates...').start();
      
      try {
        const templates = await templateManager.listTemplates(options.category);
        spinner.stop();
        
        if (templates.length === 0) {
          console.log(chalk.yellow('No templates found'));
          return;
        }
        
        const table = new Table({
          head: ['ID', 'Name', 'Category', 'Usage', 'Description'],
          style: { head: ['cyan'] },
          colWidths: [25, 25, 15, 10, 40]
        });
        
        templates.forEach(tmpl => {
          table.push([
            tmpl.id.substring(0, 23) + '...',
            tmpl.name,
            tmpl.category,
            tmpl.usageCount.toString(),
            tmpl.description.substring(0, 38) + '...'
          ]);
        });
        
        console.log(table.toString());
        
        console.log('\n' + chalk.yellow('💡 Tip: Use "template use <id>" to apply a template'));
      } catch (error) {
        spinner.fail(chalk.red('Failed to list templates'));
        console.error(error);
        process.exit(1);
      }
    });

  // Use a template
  template
    .command('use <templateId>')
    .description('Use a template to generate a prompt')
    .option('-v, --variable <key=value>', 'Set template variable (can be used multiple times)', (val, prev) => {
      prev = prev || {};
      const [key, value] = val.split('=');
      prev[key] = value;
      return prev;
    }, {})
    .option('-i, --interactive', 'Interactive mode for setting variables')
    .action(async (templateId, options) => {
      const spinner = ora('Loading template...').start();
      
      try {
        const tmpl = await templateManager.loadTemplate(templateId);
        if (!tmpl) {
          spinner.fail(chalk.red(`Template ${templateId} not found`));
          process.exit(1);
        }
        
        spinner.stop();
        
        let variables = options.variable || {};
        
        // Interactive mode
        if (options.interactive || Object.keys(variables).length === 0) {
          console.log(chalk.bold(`\nUsing template: ${tmpl.name}`));
          console.log(chalk.gray(tmpl.description));
          console.log('');
          
          const questions = tmpl.variables.map(v => ({
            type: 'input',
            name: v.name,
            message: `${v.description}${v.required ? ' (required)' : ''}:`,
            default: variables[v.name] || v.defaultValue || v.placeholder,
            validate: v.required ? 
              (input: string) => input.length > 0 || `${v.name} is required` : 
              undefined
          }));
          
          const answers = await inquirer.prompt(questions);
          variables = { ...variables, ...answers };
        }
        
        const rendered = await templateManager.renderTemplate(templateId, variables);
        
        console.log('\n' + chalk.bold('Generated Prompt:'));
        console.log(chalk.green('─'.repeat(60)));
        console.log(rendered);
        console.log(chalk.green('─'.repeat(60)));
        
        // Ask if user wants to send it
        const { action } = await inquirer.prompt([{
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Send to GPT-4o', value: 'send' },
            { name: 'Copy to clipboard', value: 'copy' },
            { name: 'Save to file', value: 'save' },
            { name: 'Exit', value: 'exit' }
          ]
        }]);
        
        switch (action) {
          case 'send':
            // This would integrate with the prompt command
            console.log(chalk.yellow('\n💡 Use: claude-prompter prompt -m "..." --send'));
            break;
          case 'copy':
            // Would need clipboard integration
            console.log(chalk.yellow('Clipboard integration coming soon!'));
            break;
          case 'save':
            const { filename } = await inquirer.prompt([{
              type: 'input',
              name: 'filename',
              message: 'Save as:',
              default: `${tmpl.name.toLowerCase().replace(/\s+/g, '-')}.txt`
            }]);
            fs.writeFileSync(filename, rendered);
            console.log(chalk.green(`✓ Saved to ${filename}`));
            break;
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to use template'));
        console.error(error);
        process.exit(1);
      }
    });

  // Create a new template
  template
    .command('create')
    .description('Create a new prompt template')
    .action(async () => {
      console.log(chalk.bold('Create a New Template\n'));
      
      const basicInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Template name:',
          validate: (input) => input.length > 0 || 'Name is required'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          validate: (input) => input.length > 0 || 'Description is required'
        },
        {
          type: 'input',
          name: 'category',
          message: 'Category:',
          default: 'general'
        },
        {
          type: 'input',
          name: 'tags',
          message: 'Tags (comma-separated):',
          default: ''
        }
      ]);
      
      console.log('\n' + chalk.bold('Template Content'));
      console.log(chalk.gray('Use {{variableName}} for variables'));
      
      const { template: templateContent } = await inquirer.prompt([{
        type: 'editor',
        name: 'template',
        message: 'Enter template content:'
      }]);
      
      // Extract variables from template
      const variableMatches = templateContent.match(/{{\s*(\w+)\s*}}/g) || [];
      const variableNames = [...new Set(variableMatches.map(
        (match: string) => match.replace(/[{}s]/g, '').trim()
      ))];
      
      const variables = [];
      if (variableNames.length > 0) {
        console.log('\n' + chalk.bold('Define Variables'));
        
        for (const varName of variableNames) {
          console.log(`\nVariable: ${chalk.cyan(varName)}`);
          const varInfo = await inquirer.prompt<any>([
            {
              type: 'input',
              name: 'description',
              message: 'Description:',
              default: varName
            },
            {
              type: 'list',
              name: 'type',
              message: 'Type:',
              choices: ['string', 'number', 'boolean'],
              default: 'string'
            },
            {
              type: 'confirm',
              name: 'required',
              message: 'Required?',
              default: true
            },
            {
              type: 'input',
              name: 'defaultValue',
              message: 'Default value (optional):',
              when: ((answers: any) => !answers.required) as any
            }
          ]);
          
          variables.push({
            name: varName,
            ...varInfo
          });
        }
      }
      
      const spinner = ora('Creating template...').start();
      
      try {
        const tags = basicInfo.tags 
          ? basicInfo.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];
          
        const newTemplate = await templateManager.createTemplate(
          basicInfo.name,
          basicInfo.description,
          templateContent,
          variables as TemplateVariable[],
          basicInfo.category,
          tags
        );
        
        spinner.succeed(chalk.green('✓ Template created successfully!'));
        console.log(chalk.cyan('ID:'), newTemplate.id);
      } catch (error) {
        spinner.fail(chalk.red('Failed to create template'));
        console.error(error);
        process.exit(1);
      }
    });

  // Search templates
  template
    .command('search <query>')
    .description('Search for templates')
    .action(async (query) => {
      const spinner = ora('Searching templates...').start();
      
      try {
        const results = await templateManager.searchTemplates(query);
        spinner.stop();
        
        if (results.length === 0) {
          console.log(chalk.yellow(`No templates found matching "${query}"`));
          return;
        }
        
        console.log(chalk.green(`Found ${results.length} templates:\n`));
        
        results.forEach(tmpl => {
          console.log(chalk.bold(tmpl.name) + ` (${tmpl.id})`);
          console.log(`  Category: ${tmpl.category}`);
          console.log(`  ${tmpl.description}`);
          console.log('');
        });
      } catch (error) {
        spinner.fail(chalk.red('Search failed'));
        console.error(error);
        process.exit(1);
      }
    });

  // Show template details
  template
    .command('show <templateId>')
    .description('Show detailed template information')
    .action(async (templateId) => {
      const spinner = ora('Loading template...').start();
      
      try {
        const tmpl = await templateManager.loadTemplate(templateId);
        if (!tmpl) {
          spinner.fail(chalk.red(`Template ${templateId} not found`));
          process.exit(1);
        }
        
        spinner.stop();
        
        console.log('\n' + chalk.bold(tmpl.name));
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.cyan('ID:'), tmpl.id);
        console.log(chalk.cyan('Category:'), tmpl.category);
        console.log(chalk.cyan('Tags:'), tmpl.tags.join(', ') || 'none');
        console.log(chalk.cyan('Usage Count:'), tmpl.usageCount);
        console.log(chalk.cyan('Description:'), tmpl.description);
        
        console.log('\n' + chalk.bold('Template:'));
        console.log(chalk.gray(tmpl.template));
        
        if (tmpl.variables.length > 0) {
          console.log('\n' + chalk.bold('Variables:'));
          tmpl.variables.forEach(v => {
            console.log(`  ${chalk.cyan(v.name)} (${v.type})${v.required ? ' *required' : ''}`);
            console.log(`    ${v.description}`);
            if (v.defaultValue !== undefined) {
              console.log(`    Default: ${v.defaultValue}`);
            }
          });
        }
        
        if (tmpl.examples && tmpl.examples.length > 0) {
          console.log('\n' + chalk.bold('Examples:'));
          tmpl.examples.forEach((ex, i) => {
            console.log(`  ${i + 1}. ${ex.description}`);
          });
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to show template'));
        console.error(error);
        process.exit(1);
      }
    });

  return template;
}