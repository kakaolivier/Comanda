
package br.com.comandadigital.api.service;

import br.com.comandadigital.api.dto.CadastroUsuarioRequest;
import br.com.comandadigital.api.dto.LoginRequest;
import br.com.comandadigital.api.dto.LoginResponse;
import br.com.comandadigital.api.dto.UsuarioResponse;
import br.com.comandadigital.api.model.Usuario;
import br.com.comandadigital.api.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import br.com.comandadigital.api.security.JwtService;

import java.util.Locale;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();
    private final JwtService jwtService;

    public UsuarioService(UsuarioRepository repository, JwtService jwtService) {
        this.usuarioRepository = repository;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest request) {
    String email = request.email()
            .trim()
            .toLowerCase(java.util.Locale.ROOT);

    Usuario usuario = usuarioRepository.findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "E-mail ou senha inválidos"
            ));

    if (!passwordEncoder.matches(
            request.senha(),
            usuario.getSenha())) {
        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "E-mail ou senha inválidos"
        );
    }

    return new LoginResponse(
            usuario.getId(),
            usuario.getNome(),
            usuario.getEmail(),
            usuario.getPerfil(),
            jwtService.generateToken(usuario)
    );
}

    @Transactional
    public UsuarioResponse cadastrar(CadastroUsuarioRequest request) {
        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (usuarioRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Este e-mail já está cadastrado"
            );
        }

        Usuario usuario = new Usuario();
        usuario.setNome(request.nome().trim());
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(request.perfil());

        Usuario salvo = usuarioRepository.save(usuario);

        return new UsuarioResponse(
                salvo.getId(),
                salvo.getNome(),
                salvo.getEmail(),
                salvo.getPerfil()
        );
    }
    
}
