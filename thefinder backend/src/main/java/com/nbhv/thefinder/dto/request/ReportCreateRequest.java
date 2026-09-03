package com.nbhv.thefinder.dto.request;

import com.nbhv.thefinder.entity.enums.ReportReason;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportCreateRequest {

    @NotNull
    private ReportReason reason;

    private String detail;
}
