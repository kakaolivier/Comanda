
package br.com.comandadigital.api.controller;

import br.com.comandadigital.api.model.Mesa;
import br.com.comandadigital.api.repository.MesaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/mesas")
public class MesaController {

    private final MesaRepository repository;

    public MesaController(MesaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Mesa> listar() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mesa cadastrar(@RequestBody Mesa mesa) {
        if (mesa.getNumero() == null || mesa.getNumero() <= 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Numero de mesa invalido"
            );
        }

        if (repository.findByNumero(mesa.getNumero()).isPresent()) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Mesa ja cadastrada"
            );
        }

        mesa.setId(null);
        mesa.setOcupada(false);
        return repository.save(mesa);
    }
}
