package com.nbhv.thefinder.dto.request;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClaimReportRequest {
    @NotBlank(message = "Mô tả nhận dạng không được để trống")
    @Size(min = 10, max = 2000, message = "Mô tả nhận dạng phải từ 10 đến 2000 ký tự")
    private String description;

    @NotNull(message = "Thời gian gặp không được để trống")
    @Future(message = "Thời gian gặp phải ở tương lai")
    private LocalDateTime meetTime;

    @NotBlank(message = "Địa điểm gặp không được để trống")
    @Size(max = 500, message = "Địa điểm gặp không được vượt quá 500 ký tự")
    private String meetLocation;
}
