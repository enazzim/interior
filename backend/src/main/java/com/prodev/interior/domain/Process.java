package com.prodev.interior.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "processes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Process {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long processId;

    @Column(nullable = false)
    private String processName;

    private Integer sortOrder;

    public void updateProcessInfo(String processName, Integer sortOrder) {
        this.processName = processName;
        this.sortOrder = sortOrder;
    }
}
