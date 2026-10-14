
package br.com.comandadigital.api.dto;

public record UsuarioResponse(
    Long id,
    String nome,
    String email,
    String perfil
) {
}
