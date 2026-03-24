ALTER TABLE transfers ADD CONSTRAINT chk_transfers_different_branches CHECK (from_branch_id != to_branch_id);
