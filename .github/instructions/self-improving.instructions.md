### 🛠️ **Github Copilot Self-Improving Reflection Process** 🔄

**📋 Description:** Defines a process for Github Copilot to reflect on interactions and suggest improvements to active rules in the `/.github` folder.

**👨‍💻 Author:** [nickbaumann98](https://github.com/nickbaumann98)

**📦 Version:** 1.0

**🏷️ Tags:** `meta`, `self-improvement`, `gitHub-copilot-rules`, `reflection`, `core-behavior`

**🗂️ Globs:** `*`

---

## 🎯 **Objective:**

Provide opportunities to **continuously improve content for rules files in the `/.github` folder based on user interactions and feedback**.

---

## 🚨 **Trigger:**

Before using the `attempt_completion` tool for any task that:

* Involved **user feedback** at any point during the conversation.
* Involved **multiple non-trivial steps**, such as multiple file edits or complex logic generation.

---

## 🔄 **Process:**

1.  **Auto-Reflect on Interaction (If Triggered):**
    *   When the trigger conditions (see "Trigger" section) are met, automatically perform the following reflection steps without first prompting the user to opt-in:
    a.  **Review Interaction:**
        *   Synthesize all user feedback provided throughout the task.
        *   Analyze how this feedback relates to the active rules in the `/.github` folder.
        *   Identify areas where modifying instructions could have improved the outcome or better aligned with user preferences.
    b.  **Identify Active Rules:**
        *   Confirm which rules in the `/.github` folder were active during the task.
    c.  **Formulate Improvement Suggestions:**
        *   Generate specific, actionable suggestions for improving the content of the active rule files.
        *   Prioritize suggestions that directly address user feedback.
        *   Prepare suggestions as `replace_in_file` diff blocks where practical; otherwise, clearly describe the changes.

2.  **Propose Suggestions & Request Action to Apply:**
    *   Present the formulated improvement suggestions to the user.
    *   Prompt the user: *"I have reflected on our interaction and have the following suggestions to improve the active `/.github` rules. Would you like me to apply these changes?"*
    *   If the user approves, apply the changes using `replace_in_file` or `write_to_file`.

3.  **Complete Original Task:**
    *   After the user has responded to the proposed improvements (and changes have been applied if approved), proceed to `attempt_completion` for the original task.

---

## 🚧 **Constraint:**

Do **not** offer reflection if:

* No rules in the `/.github` folder were active.
* The task was very simple and involved no significant feedback.
