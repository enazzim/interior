package com.prodev.interior.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ProjectHistoryDTO {
    private Long historyId;
    private Long projectId;
    private String fromStatus;
    private String toStatus;
    private String changedByName;
    private LocalDateTime createdAt;
}
