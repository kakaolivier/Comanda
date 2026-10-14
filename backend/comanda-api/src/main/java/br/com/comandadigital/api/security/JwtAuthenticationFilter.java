
package br.com.comandadigital.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        try {
            boolean tokenValido = jwtService.isTokenValid(token);
            System.out.println("JWT recebido; válido: " + tokenValido);

            if (tokenValido
                    && SecurityContextHolder.getContext()
                            .getAuthentication() == null) {

                Claims claims = jwtService.extractClaims(token);
                String email = claims.getSubject();
                String perfil = claims.get("perfil", String.class);

                String autoridade = switch (perfil == null ? "" : perfil) {
                    case "Garçom" -> "ROLE_GARCOM";
                    case "Cozinha" -> "ROLE_COZINHA";
                    case "Administrador" -> "ROLE_ADMIN";
                    default -> "ROLE_USER";
                };

                var autenticacao = new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority(
                                autoridade)));

                SecurityContextHolder.getContext()
                        .setAuthentication(autenticacao);
            }
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("Erro ao validar JWT: " + e.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
