# Project Contribution Guidelines

## Introduction

I welcome and appreciate contributions to this Repo. This document outlines the process and guidelines for contributing to the project.
## Table of Contents
* [Methods of Contribution](#methods-of-contribution)
* [Contribution Workflow](#contribution-workflow)
* [Development Environment Setup](#development-environment-setup)
* [Pull Request Submission Standards](#pull-request-submission-standards)
* [Contributor License Agreement](#contributor-license-agreement)

## Methods of Contribution
Contributions are not limited to code. I encourage support in the following areas:

* **Bug Reports:** Submit a detailed [issue](https://github.com/Einkornwolf/Pterodactyl-Discord-Manager/issues) if you discover a bug. Include clear steps to reproduce the issue, the expected behavior, and the actual result.
* **Feature Suggestions:** Propose new features by creating an [issue](https://github.com/Einkornwolf/Pterodactyl-Discord-Manager/issues) with a comprehensive description of your proposal.
* **Translations:** Improve existing translations (German, English, French) or add support for a new language. All localization files are located in the [`/translations`](./translations/) directory.
* **Documentation:** Suggest improvements to the README or other documentation to enhance clarity.
* **Code Contributions:** Submit code to resolve bugs or implement new features by following the workflow detailed below.

## Contribution Workflow
To maintain code quality, please adhere to the following standard procedure for all code contributions:

1.  **Select an Issue:** Identify an existing [issue](https://github.com/Einkornwolf/Pterodactyl-Discord-Manager/issues) to address or create a new one. State your intent to work on the issue in a comment to avoid duplicate efforts.
2.  **Fork the Repository:** Create a personal fork of the project repository.
3.  **Clone Your Fork:** Clone your forked repository to your local machine.
    ```bash
    git clone [https://github.com/YOUR-USERNAME/Pterodactyl-Discord-Manager.git](https://github.com/YOUR-USERNAME/Pterodactyl-Discord-Manager.git)
    cd Pterodactyl-Discord-Manager
    ```
4.  **Create a New Branch:** Create a new, descriptively named branch for your changes.
    ```bash
    # For new features:
    git checkout -b feature/feature-name

    # For bug fixes:
    git checkout -b fix/fix-description
    ```
5.  **Implement Changes:** Make the necessary code modifications.
6.  **Commit Changes:** Commit your work with a clear and descriptive commit message.
    ```bash
    # Example for a new feature:
    git commit -m "feature: Implement the blackjack mini-game"

    # Example for a bug fix:
    git commit -m "fix: Resolve incorrect calculation for server renewal prices"
    ```
7.  **Push Changes:** Push the new branch to your forked repository.
    ```bash
    git push origin feature/feature-name
    ```
8.  **Submit a Pull Request:** Open a pull request from your branch to the `main` branch of the upstream repository.

## Development Environment Setup
A local development environment requires **Node.js** (version 16.x or higher is recommended).

1.  **Clone the repository** as described above.
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create the configuration file:** Create a new file named `config.env` in the project's root directory.
4.  **Configure the application:** Copy the template from the [README](./README.md#installation) into `config.env` and populate it with your specific configuration values.
5.  **Start the application:**
    ```bash
    node bot.js
    ```

## Contributor License Agreement
All contributions to this project are subject to its **Custom Non-Commercial Copyleft License (CNCCL)**. By submitting a Pull Request, you agree that your work will be licensed under these terms. All existing copyright and license notices must be preserved in all files.
