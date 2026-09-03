# CMU Activity Match — Project Context

## Overview

CMU Activity Match is a web application for Carnegie Mellon University students to create, discover, and join plans for activities with other students.

Examples of activities include:

* Going out to eat
* Visiting museums
* Skating
* Playing games
* Watching movies
* Exploring Pittsburgh

A student can create an activity by specifying information such as the activity, date/time, location, category, number of people, and preferences. Other students can discover activities, filter/search for them, view the details, and apply to join. The activity creator can review applicants and accept or reject them.

The application should eventually support recommendations based on users' interests and activity information, as well as communication between participants.

---

## Team Scope

Our team is responsible for the following functionality:

### 1. User Profiles

* Create profile
* Edit profile
* Store/edit:

  * CMU email
  * Hobbies
  * Career
  * Nationality
  * Languages
  * Personal information
  * Categories/interests

### 2. Create and Manage Activities

Users can create an activity with:

* Title
* Description
* Date/time
* Location
* Maximum number of people
* Category
* Gender restriction

Activity creators should eventually be able to:

* View their activities
* Modify an activity
* Delete an activity
* Modify an activity only when appropriate (for example, before someone has applied)
* View applicants
* View applicant profiles and short notes
* Accept or reject applicants
* Select participants
* Notify participants

### 3. Activity Recommendations

Eventually recommend activities based on:

* Selected interests/categories
* Date/time
* Other relevant activity preferences

### 4. Discover and Join Activities

Students should eventually be able to:

* Search activities
* Filter by date
* Filter by category
* Filter by gender
* View complete activity information
* Submit an application
* Add a short note when applying

### 5. Interaction

Eventually support:

* Chat
* Sending messages between participants

---

## Important Product Principle

This project will be developed incrementally as part of an Agile course.

DO NOT build the entire application at once.

We will implement functionality sprint by sprint.

Future functionality should remain as TODOs rather than being implemented prematurely.

For example:

* Authentication may be a TODO if it is not part of the current sprint.
* Chat should remain a TODO until its sprint.
* Recommendations should remain a TODO until its sprint.
* Applicant management should remain a TODO until its sprint.

The application should be designed so that these features can be added later without rewriting the existing system.

---

## Development Principles

1. Keep the architecture simple and maintainable.
2. Prefer incremental changes.
3. Do not rewrite working functionality unless explicitly requested.
4. Do not implement future features without being asked.
5. Clearly identify TODOs for future functionality.
6. Preserve existing functionality when adding new features.
7. Before making significant changes, explain what files/components will be changed and why.
8. Keep the project easy for a team with limited software-development experience to understand.
9. Avoid unnecessary technologies, abstractions, or infrastructure.
10. The project will evolve weekly, so maintain clear project documentation and context.

---

## Initial Goal

For the first phase, help us establish the foundations of the web application rather than implementing every feature.

We need to decide and establish:

* Frontend technology
* Backend/database approach
* Project structure
* Git/GitHub workflow
* Local development workflow
* Deployment strategy
* Database schema
* Initial UI structure
* Documentation/context files
* TODO list for future functionality

After the foundation is established, we will implement features incrementally each week.

## Important

Do not assume that all listed features should be implemented now.

Treat the feature list above as the product roadmap/backlog, not as the current sprint.

Ask/identify what belongs to the current sprint before implementing a large feature set.