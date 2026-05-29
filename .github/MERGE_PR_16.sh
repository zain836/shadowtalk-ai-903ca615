#!/bin/bash
# Temporary merge script for PR #16 via GitHub CLI
# This will be used to document the merge action

gh pr merge 16 --squash --admin --delete-branch
