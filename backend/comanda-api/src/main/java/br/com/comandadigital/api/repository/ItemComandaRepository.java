
package br.com.comandadigital.api.repository;

import br.com.comandadigital.api.model.ItemComanda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItemComandaRepository
        extends JpaRepository<ItemComanda, Long> {

    List<ItemComanda> findByComandaId(Long comandaId);
}
