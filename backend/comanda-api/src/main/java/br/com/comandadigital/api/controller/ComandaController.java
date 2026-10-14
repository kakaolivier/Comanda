
package br.com.comandadigital.api.controller;

import br.com.comandadigital.api.model.Comanda;
import br.com.comandadigital.api.model.Mesa;
import br.com.comandadigital.api.repository.ComandaRepository;
import br.com.comandadigital.api.repository.MesaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/comandas")
public class ComandaController {

    private final ComandaRepository comandaRepository;
    private final MesaRepository mesaRepository;

    public ComandaController(
            ComandaRepository comandaRepository,
            MesaRepository mesaRepository) {
        this.comandaRepository = comandaRepository;
        this.mesaRepository = mesaRepository;
    }

    @PostMapping("/abrir/{mesaId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Comanda abrir(@PathVariable Long mesaId) {

        Mesa mesa = mesaRepository.findById(mesaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Mesa nao encontrada"));

        if (mesa.isOcupada() ||
                comandaRepository.findByMesaIdAndStatus(mesaId, "ABERTA").isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Mesa ja possui comanda aberta");
        }

        Comanda comanda = new Comanda();
        comanda.setMesa(mesa);
        comanda.setStatus("ABERTA");

        mesa.setOcupada(true);
        mesaRepository.save(mesa);

        return comandaRepository.save(comanda);
    }

    @GetMapping("/{id}")
    public Comanda buscar(@PathVariable Long id) {
        return comandaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Comanda nao encontrada"));
    }

    @GetMapping("/mesa/{mesaId}")
    public Comanda buscarAbertaPorMesa(@PathVariable Long mesaId) {
        return comandaRepository
                .findByMesaIdAndStatus(mesaId, "ABERTA")
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nenhuma comanda aberta"));
    }

    @PatchMapping("/{id}/fechar")
    @Transactional
    public Comanda fechar(@PathVariable Long id) {

        Comanda comanda = comandaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Comanda nao encontrada"));

        if (!"ABERTA".equals(comanda.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Comanda ja esta fechada");
        }

        Mesa mesa = comanda.getMesa();

        comanda.setStatus("FECHADA");
        comanda.setFechadaEm(java.time.LocalDateTime.now());

        mesa.setOcupada(false);

        mesaRepository.save(mesa);

        return comandaRepository.save(comanda);
    }

}
