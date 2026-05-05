package com.school.attendance.config;

import org.springframework.aot.hint.MemberCategory;
import org.springframework.aot.hint.RuntimeHints;
import org.springframework.aot.hint.RuntimeHintsRegistrar;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.ImportRuntimeHints;

@Configuration
@ImportRuntimeHints(NativeRuntimeHints.HibernateHints.class)
public class NativeRuntimeHints {

    static class HibernateHints implements RuntimeHintsRegistrar {
        @Override
        public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
            // Registrar la implementación del logger de Hibernate
            hints.reflection().registerType(
                org.springframework.aot.hint.TypeReference.of("org.hibernate.internal.log.ConnectionInfoLogger_$logger"),
                MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS,
                MemberCategory.INVOKE_PUBLIC_METHODS
            );

            // Registrar arrays de listeners de Hibernate (necesarios para la inicialización de JPA)
            String[] listenerClasses = {
                "org.hibernate.event.spi.PostUpsertEventListener",
                "org.hibernate.event.spi.PostInsertEventListener",
                "org.hibernate.event.spi.PostUpdateEventListener",
                "org.hibernate.event.spi.PostDeleteEventListener",
                "org.hibernate.event.spi.PreInsertEventListener",
                "org.hibernate.event.spi.PreUpdateEventListener",
                "org.hibernate.event.spi.PreDeleteEventListener",
                "org.hibernate.event.spi.PostLoadEventListener"
            };

            for (String className : listenerClasses) {
                // Registrar el tipo base
                hints.reflection().registerType(
                    org.springframework.aot.hint.TypeReference.of(className),
                    MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS,
                    MemberCategory.INVOKE_PUBLIC_METHODS
                );
                // Registrar el array del tipo
                hints.reflection().registerType(
                    org.springframework.aot.hint.TypeReference.of(className + "[]"),
                    MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS
                );
            }

            // Registrar Persisters de Hibernate (especialmente para herencia JOINED)
            String[] persisterClasses = {
                "org.hibernate.persister.entity.JoinedSubclassEntityPersister",
                "org.hibernate.persister.entity.SingleTableEntityPersister",
                "org.hibernate.persister.entity.UnionSubclassEntityPersister",
                "org.hibernate.persister.collection.OneToManyPersister",
                "org.hibernate.persister.collection.BasicCollectionPersister"
            };

            for (String className : persisterClasses) {
                hints.reflection().registerType(
                    org.springframework.aot.hint.TypeReference.of(className),
                    MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS,
                    MemberCategory.INVOKE_PUBLIC_METHODS,
                    MemberCategory.DECLARED_FIELDS
                );
            }

            // Proxy de Hibernate para H2
            hints.reflection().registerType(
                org.springframework.aot.hint.TypeReference.of("org.hibernate.dialect.H2Dialect"),
                MemberCategory.INVOKE_PUBLIC_CONSTRUCTORS
            );
        }
    }
}
