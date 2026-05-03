package com.school.attendance.model;

import lombok.Getter;

@Getter
public enum AttendanceStatus {
    PRESENTE(0.0),
    AUSENTE(1.0), // El peso final dependerá del turno (0.5 o 1.0)
    TARDANZA_1_4(0.25),
    TARDANZA_1_2(0.50),
    RETIRO_ANTICIPADO(0.50),
    JUSTIFICADA(0.0),
    NO_APLICA(0.0);

    private final double defaultWeight;

    AttendanceStatus(double defaultWeight) {
        this.defaultWeight = defaultWeight;
    }
}
