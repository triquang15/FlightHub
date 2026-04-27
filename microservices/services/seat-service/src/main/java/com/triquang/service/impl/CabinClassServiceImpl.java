package com.triquang.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.triquang.enums.CabinClassType;
import com.triquang.enums.ErrorCode;
import com.triquang.exception.BaseException;
import com.triquang.mapper.CabinClassMapper;
import com.triquang.model.CabinClass;
import com.triquang.payload.request.CabinClassRequest;
import com.triquang.payload.response.CabinClassResponse;
import com.triquang.repository.CabinClassRepository;
import com.triquang.service.CabinClassService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CabinClassServiceImpl implements CabinClassService {

    private final CabinClassRepository cabinClassRepository;

    @Override
    public CabinClassResponse createCabinClass(CabinClassRequest request) {

        if (cabinClassRepository.existsByCodeAndAircraftId(
                request.getCode().toUpperCase(),
                request.getAircraftId())) {

            throw new BaseException(ErrorCode.CABIN_CLASS_ALREADY_EXISTS); 
        }

        CabinClass cabinClass = CabinClassMapper.toEntity(request);
        cabinClass.setAircraftId(request.getAircraftId());

        CabinClass saved = cabinClassRepository.save(cabinClass);
        return CabinClassMapper.toResponse(saved, null);
    }

    @Override
    public List<CabinClassResponse> createCabinClasses(List<CabinClassRequest> requests) {

        List<CabinClass> toSave = requests.stream()
                .filter(req -> !cabinClassRepository.existsByCodeAndAircraftId(
                        req.getCode().toUpperCase(), req.getAircraftId()))
                .map(req -> {
                    CabinClass cc = CabinClassMapper.toEntity(req);
                    cc.setAircraftId(req.getAircraftId());
                    return cc;
                })
                .collect(Collectors.toList());

        return cabinClassRepository.saveAll(toSave).stream()
                .map(cc -> CabinClassMapper.toResponse(cc, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CabinClassResponse getCabinClassById(Long id) {

        CabinClass cabinClass = cabinClassRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND)); 

        return CabinClassMapper.toResponse(cabinClass, cabinClass.getSeatMap());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CabinClassResponse> getCabinClassesByAircraftId(Long aircraftId) {

        return cabinClassRepository.findByAircraftId(aircraftId).stream()
                .map(cc -> CabinClassMapper.toResponse(cc, cc.getSeatMap()))
                .collect(Collectors.toList());
    }

    @Override
    public CabinClassResponse getByAircraftIdAndName(Long aircraftId, CabinClassType name) {

        CabinClass cabinClass = cabinClassRepository
                .findByAircraftIdAndName(aircraftId, name);

        if (cabinClass == null) {
            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        return CabinClassMapper.toResponse(cabinClass, null);
    }

    @Override
    public CabinClassResponse updateCabinClass(Long id, CabinClassRequest request) {

        CabinClass existing = cabinClassRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

        if (cabinClassRepository.existsByCodeAndAircraftIdAndIdNot(
                request.getCode().toUpperCase(),
                existing.getAircraftId(),
                id)) {

            throw new BaseException(ErrorCode.INVALID_INPUT);
        }

        CabinClassMapper.updateEntity(request, existing);

        CabinClass saved = cabinClassRepository.save(existing);
        return CabinClassMapper.toResponse(saved, saved.getSeatMap());
    }

    @Override
    public void deleteCabinClass(Long id) {

        CabinClass cabinClass = cabinClassRepository.findById(id)
                .orElseThrow(() -> new BaseException(ErrorCode.CABIN_CLASS_NOT_FOUND));

        cabinClassRepository.delete(cabinClass);
    }
}
