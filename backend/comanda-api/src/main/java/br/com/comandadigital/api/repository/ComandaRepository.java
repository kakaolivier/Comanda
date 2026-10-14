
package br.com.comandadigital.api.repository;

import br.com.comandadigital.api.model.Comanda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ComandaRepository extends JpaRepository<Comanda, Long> {

    Optional<Comanda> findByMesaIdAndStatus(Long mesaId, String status);
}
