# Memory Bank Documentation

## Overview

The Memory Bank is a central repository for preserving essential project knowledge and context that might otherwise be lost over time. It functions as an institutional memory for the development team.

## Implementation

- **Storage Location**: `memory-bank\`
- **Memory Bank Instructions File Name**: `/memory-bank/memory-bank-instructions.md` serves as the primary guide for migrating static memory-bank content into a dynamic Knowledge Graph system.
- **Format**: Structured markdown organized by domain. For example:

  ```markdown
  ## [Domain] - [Title]
  - **Date:** [YYYY-MM-DD]
  - **Description:** [Brief description of the entry]
  - **Related Issues:** [#123](https://github.com/your-repo/your-project/issues/123)
  - **Implementation PR:** [#456](https://github.com/your-repo/your-project/pull/456)
  ```

  Alternatively, refer to the [Markdown Template](/memory-bank/docs/markdown-template.md) for detailed guidance on structuring memory entries, including required fields and formatting conventions.
  If the template file is missing, please contact the project maintainer or refer to existing memory entries for formatting examples.
- **File Paths**:
- **Primary Configuration**: `/memory-bank/memory-bank-instructions.md`
    - Contains the core instructions and structure for the Memory Bank system
- **Documentation**: `/memory-bank/documentation/usage-guide.md`
    - Provides detailed usage guidelines and examples for contributors

## Usage Guidelines

### Adding New Memory Entries

1. **Select Appropriate Template**
   - Use `/memory-bank/templates/entry-template.md` as your starting point
   - Save new entries in `/memory-bank/entries/[domain]-[brief-title].md`

2. **Entry Creation Process**
   - Create entries for architectural decisions, technical challenges, or significant implementation details
   - Include a descriptive title with domain prefix (Frontend, Backend, Infrastructure, etc.)
   - Always add the current date in YYYY-MM-DD format
   - Provide complete context that would help future developers understand the decision

3. **Required Fields**
   - **Date:** When the decision was made or issue was encountered
   - **Description:** Concise summary of the entry
   - **Context:** Background information leading to this entry
   - **Decision/Solution:** What was decided or implemented
   - **Alternatives Considered:** Other options that were evaluated
   - **Consequences:** Expected impacts on the project
   - **Related Issues/PRs:** GitHub links to relevant tickets and pull requests

### Maintaining the Knowledge Graph

1. **Updating Existing Entries**
   - Add new information with a dated update section
   - Never remove historical context - append new information instead. For example:

     ```markdown
     ## 2023-09-01 - Backend - Initial Database Setup
     - **Decision:** Chose PostgreSQL for the database.
     - **Rationale:** Relational model suited the initial requirements.
     - **Impact:** Enabled structured queries and ensured data integrity.

2. **Quarterly Maintenance**
   - Review all entries for accuracy and relevance.
   - Identify orphaned nodes in the knowledge graph:
     - **Tool Suggestion:** Use tools like Neo4j Browser or GraphQL Playground to visualize and query the graph for nodes without relationships.
     - **Example Script:** Use the following Neo4j Cypher query to detect orphaned nodes:
       ```cypher
       MATCH (n)
       WHERE NOT (n)--()
       RETURN n
       ```
   - Identify orphaned nodes in the knowledge graph:
     - **Explanation:** Orphaned nodes are entries that lack connections to other nodes or references in the knowledge graph. Use graph visualization tools or query interfaces to detect nodes without incoming or outgoing relationships.
     - **Example:** A memory entry about a deprecated component that is no longer referenced in any active entries or codebase.
   - Consolidate fragmented entries about the same topic.
   - Mark obsolete entries as "Superseded" with references to newer entries.

### Querying the Memory Bank

1. **Finding Relevant Information**
   - Search by domain using directory structure
   - Use project-wide search with domain prefixes
   - Review chronological entries for historical context

2. **Referencing in Development Work**
   - Include memory bank references in PR descriptions
   - Link relevant entries in technical documentation
   - Cite memory bank entries when onboarding new team members

### Example Workflow

```
1. Identify knowledge worth preserving
2. Select appropriate template
3. Create entry with complete context
4. Add references to related GitHub artifacts
5. Link to related memory entries
6. Submit as part of the PR that implements the change
7. Reference in code comments where appropriate
```
- **Knowledge Entries**: `/memory-bank/entries/*.md`
    - Individual memory entries organized by domain and date
- **Templates**: `/memory-bank/templates/entry-template.md`
    - Standardized templates for creating new memory entries

### Purpose

To transform the static memory-bank and cline_docs folders into a dynamic Knowledge Graph Memory system that preserves relationships between project elements.

### Migration Process

1. **Inventory Existing Knowledge**
   - Catalog all entries in `memory-bank/` and `cline_docs/` folders
   - Tag entries by domain (frontend, backend, infrastructure)
   - **Attributes**: Add metadata (creation date, last updated, priority)
     - **Priority Levels**: Assign priority based on the importance and urgency of the entry. For example:
       - `High`: Critical decisions or components.
       - `Medium`: Important but non-critical elements.
       - `Low`: Optional or nice-to-have features.
     - A "Service" node could represent a backend service like `Authentication API`.
   - **Relationships**: Define connections between nodes (depends-on, implements, relates-to)
   - **Attributes**: Add metadata (creation date, last updated, priority)
     - **Priority Levels**: Assign priority based on the importance and urgency of the entry. For example:
       - `High`: Critical decisions or components that impact core functionality.
       - `Medium`: Important but non-critical elements that enhance functionality.
       - `Low`: Optional or nice-to-have features with minimal impact.

3. **Migration Steps**
   - Convert each markdown document to structured entities
   - Extract relationships from cross-references
   - Preserve chronology with timestamps
   - Use graph visualization tools like Neo4j Browser, GraphQL Playground, or D3.js for validation
   - Example Script: Use the following Neo4j Cypher query to detect orphaned nodes:
     ```cypher
     MATCH (n)
     WHERE NOT (n)--()
     RETURN n
     ```
   - Maintain links to original GitHub issues/PRs

4. **Access Pattern**
5. **Maintenance Guidelines**
   - Add new entries directly to Knowledge Graph
   - Update relationships when components change
   - Run quarterly graph validation to identify orphaned nodes
     - **Graph Validation:** This process involves checking the Knowledge Graph for inconsistencies, such as orphaned nodes (entries without connections), broken links, or outdated relationships. Use graph visualization tools or automated scripts to detect and resolve these issues.

## Content Guidelines

The Memory Bank should document:

- Architectural decisions with rationales
- Technical limitations encountered and solutions implemented
- Details about third-party service integrations
- Performance optimization approaches and outcomes
- Other critical context that future developers would benefit from knowing

## Maintenance Protocol

- Include references to Memory Bank entries in related PR descriptions (e.g., "This PR addresses the architectural decision documented in `.clinerules/memory-bank.md` under the entry dated [YYYY-MM-DD] titled '[Title]'.")
- Conduct quarterly reviews to remove outdated information and ensure relevance

## Best Practices
- **Keep entries concise and always include dates**
- Cross-reference relevant GitHub issues and PRs. For example:
  - **Issue:** [#123](https://github.com/your-repo/your-project/issues/123) - Description of the issue
  - **PR:** [#456](https://github.com/your-repo/your-project/pull/456) - Description of the pull request
- Organize content by domain (frontend, backend, infrastructure) for easier navigation
- Use consistent formatting for improved readability

## 🧠 **Memory Bank**

- **Purpose:** Preserve critical project context, decisions, and technical considerations throughout the development process
- **Location:** Memory Bank content is maintained in `.clinerules/memory-bank.md`
- **What to Store:**
  - Key architectural decisions and their rationales
  - Technical constraints and chosen workarounds
  - Third-party integration specifics
  - Performance optimization strategies
- **Example Entry:**
  - Review and prune quarterly to keep relevant
- **Usage Guidelines:**
  - Keep entries concise and dated
- **Formatting:** Use consistent markdown formatting for clarity
- **Example Entry:**

- **Example Entry:**

```markdown
## 2023-10-01 - Backend - Database Migration to MongoDB
- **Decision:** Migrated the database from PostgreSQL to MongoDB.
## 2023-10-01 - Backend - Database Migration to MongoDB
- **Decision:** Migrated the database from PostgreSQL to MongoDB.
- **Rationale:** MongoDB's document-based model aligns better with our application's data structure, improving query performance and scalability.
- **Impact:** Simplified data modeling, reduced query complexity, and improved read/write performance for high-traffic endpoints.
- **Consequences:** Required reworking existing database queries and retraining the team on MongoDB-specific features, which increased initial development time.
- **Related Issues:** [#142](https://github.com/your-repo/your-project/issues/142), [#156](https://github.com/your-repo/your-project/issues/156)
- **Implementation PR:** [#189](https://github.com/your-repo/your-project/pull/189)
