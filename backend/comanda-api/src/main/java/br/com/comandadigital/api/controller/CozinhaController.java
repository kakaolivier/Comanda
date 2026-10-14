
package br.com.comandadigital.api.controller;

import br.com.comandadigital.api.model.ItemComanda;
import br.com.comandadigital.api.repository.ItemComandaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cozinha")
public class CozinhaController {

    private final ItemComandaRepository repository;

    public CozinhaController(ItemComandaRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/itens")
    public List<ItemComanda> listarItens() {
        return repository.findAll().stream()
                .filter(item ->
                        "PENDENTE".equals(item.getStatus()) ||
                        "EM_PREPARO".equals(item.getStatus()) ||
                        "PRONTO".equals(item.getStatus()))
                .toList();
    }

    @PatchMapping("/itens/{id}/status")
    public ResponseEntity<?> atualizarStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> dados) {

        var itemOpt = repository.findById(id);

        if (itemOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String novoStatus = dados.get("status");

        if (!List.of("PENDENTE", "EM_PREPARO", "PRONTO")
                .contains(novoStatus)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "Status inválido"));
        }

        ItemComanda item = itemOpt.get();
        item.setStatus(novoStatus);

        repository.save(item);

        return ResponseEntity.ok(item);
    }
}
