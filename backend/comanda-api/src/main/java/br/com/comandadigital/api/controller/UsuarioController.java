
package br.com.comandadigital.api.controller;

import br.com.comandadigital.api.dto.CadastroUsuarioRequest;
import br.com.comandadigital.api.dto.LoginRequest;
import br.com.comandadigital.api.dto.LoginResponse;
import br.com.comandadigital.api.dto.UsuarioResponse;
import br.com.comandadigital.api.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<UsuarioResponse> cadastrar(
            @Valid @RequestBody CadastroUsuarioRequest request) {

        UsuarioResponse usuario = usuarioService.cadastrar(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(usuario);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(usuarioService.login(request));
    }
}
