CREATE TABLE swap_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    requester_home_id BIGINT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    target_home_id BIGINT NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_swap_requests_different_homes CHECK (requester_home_id <> target_home_id),
    CONSTRAINT chk_swap_requests_seven_days CHECK (end_date = start_date + 6),
    CONSTRAINT chk_swap_requests_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'))
);

CREATE INDEX idx_swap_requests_requester_home_id ON swap_requests(requester_home_id);
CREATE INDEX idx_swap_requests_target_home_id ON swap_requests(target_home_id);
