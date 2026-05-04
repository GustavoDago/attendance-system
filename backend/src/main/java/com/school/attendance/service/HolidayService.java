package com.school.attendance.service;

import com.school.attendance.dto.HolidayDTO;
import com.school.attendance.model.Holiday;
import com.school.attendance.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public List<HolidayDTO> getAllHolidays() {
        return holidayRepository.findAll().stream()
                .sorted((h1, h2) -> h2.getDate().compareTo(h1.getDate())) // Newer first
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public HolidayDTO createHoliday(HolidayDTO dto) {
        if (holidayRepository.findByDate(dto.getDate()).isPresent()) {
            throw new RuntimeException("Ya existe un feriado registrado para esa fecha.");
        }

        Holiday holiday = Holiday.builder()
                .date(dto.getDate())
                .reason(dto.getReason())
                .build();

        return toDTO(holidayRepository.save(holiday));
    }

    public void deleteHoliday(Long id) {
        holidayRepository.deleteById(id);
    }

    public Optional<HolidayDTO> checkHoliday(LocalDate date) {
        return holidayRepository.findByDate(date).map(this::toDTO);
    }

    private HolidayDTO toDTO(Holiday holiday) {
        return HolidayDTO.builder()
                .id(holiday.getId())
                .date(holiday.getDate())
                .reason(holiday.getReason())
                .build();
    }
}
