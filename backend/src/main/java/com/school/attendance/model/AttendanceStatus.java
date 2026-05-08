package com.school.attendance.model;

import lombok.Getter;

@Getter
public enum AttendanceStatus {
    PRESENTE(0.0, "P"),
    AUSENTE(1.0, "A"),
    AUSENTE_J(1.0, "AJ"),
    TARDANZA_1_4(0.25, "T¼"),
    TARDANZA_1_4_J(0.25, "TJ¼"),
    TARDANZA_1_2(0.50, "T½"),
    TARDANZA_1_2_J(0.50, "TJ½"),
    RETIRO_1_2(0.50, "R½"),
    RETIRO_1_2_J(0.50, "RJ½"),
    RETIRO_1_4(0.25, "R¼"),
    RETIRO_1_4_J(0.25, "RJ¼"),
    NO_APLICA(0.0, "N/A");

    private final double defaultWeight;
    private final String label;

    AttendanceStatus(double defaultWeight, String label) {
        this.defaultWeight = defaultWeight;
        this.label = label;
    }

    /**
     * Indica si este estado tiene justificación presentada.
     * Los estados justificados cuentan con el mismo peso que los injustificados;
     * el sufijo _J solo indica que la escuela recibió el certificado correspondiente.
     */
    public boolean isJustified() {
        return this.name().endsWith("_J");
    }

    /**
     * Indica si este estado representa una presencia efectiva (no genera falta).
     */
    public boolean isPresent() {
        return this == PRESENTE || this == NO_APLICA;
    }
}
