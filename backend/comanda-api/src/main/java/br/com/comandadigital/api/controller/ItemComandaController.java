
package br.com.comandadigital.api.controller;

import br.com.comandadigital.api.model.*;
import br.com.comandadigital.api.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/comandas/{comandaId}/itens")
public class ItemComandaController {

    private final ItemComandaRepository itemRepository;
    private final ComandaRepository comandaRepository;
    private final ProdutoRepository produtoRepository;

    public ItemComandaController(
            ItemComandaRepository itemRepository,
            ComandaRepository comandaRepository,
            ProdutoRepository produtoRepository) {
        this.itemRepository = itemRepository;
        this.comandaRepository = comandaRepository;
        this.produtoRepository = produtoRepository;
    }

    public record ItemRequest(Long produtoId, Integer quantidade) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ItemComanda adicionar(
            @PathVariable Long comandaId,
            @RequestBody ItemRequest request) {

        Comanda comanda = comandaRepository.findById(comandaId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Comanda nao encontrada"));

        if (!"ABERTA".equals(comanda.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Comanda nao esta aberta");
        }

        if (request.produtoId() == null ||
                request.quantidade() == null ||
                request.quantidade() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Item invalido");
        }

        Produto produto = produtoRepository.findById(request.produtoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Produto nao encontrado"));

        if (!produto.isAtivo()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Produto inativo");
        }

        ItemComanda item = new ItemComanda();
        item.setComanda(comanda);
        item.setProduto(produto);
        item.setQuantidade(request.quantidade());
        item.setPrecoUnitario(produto.getPreco());
        item.setStatus("PENDENTE");

        return itemRepository.save(item);
    }

    @GetMapping
    public List<ItemComanda> listar(@PathVariable Long comandaId) {
        if (!comandaRepository.existsById(comandaId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Comanda nao encontrada");
        }
        return itemRepository.findByComandaId(comandaId);
    }

    @GetMapping("/total")
    public BigDecimal total(@PathVariable Long comandaId) {
        if (!comandaRepository.existsById(comandaId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Comanda nao encontrada");
        }

        return itemRepository.findByComandaId(comandaId)
                .stream()
                .map(item -> item.getPrecoUnitario()
                        .multiply(BigDecimal.valueOf(item.getQuantidade())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
