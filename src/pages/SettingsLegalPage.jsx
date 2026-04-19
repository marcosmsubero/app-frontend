import { useNavigate } from "react-router-dom";
import "../styles/settings.css";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

const APP_NAME = "RunVibe";
const CONTACT_EMAIL = "marcos5subero@gmail.com";
const LAST_UPDATED = "abril de 2026";

function PrivacyPolicy() {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Política de Privacidad de {APP_NAME}</h2>
      <p className="settingsMuted">Última actualización: {LAST_UPDATED}</p>

      <p>
        Esta política explica qué datos personales tratamos en {APP_NAME}, con
        qué finalidades, durante cuánto tiempo y qué derechos tienes sobre
        ellos. Está redactada conforme al Reglamento (UE) 2016/679 (RGPD) y a
        la Ley Orgánica 3/2018 de Protección de Datos y Garantía de los
        Derechos Digitales (LOPDGDD).
      </p>

      <h3>1. Responsable del tratamiento</h3>
      <p>
        El responsable del tratamiento de tus datos es el equipo de {APP_NAME}.
        Puedes contactar con nosotros en{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="settingsLink">
          {CONTACT_EMAIL}
        </a>{" "}
        o desde Ajustes → Contactar soporte.
      </p>

      <h3>2. Datos que tratamos</h3>
      <p>
        Tratamos únicamente los datos estrictamente necesarios para prestar el
        servicio (principio de minimización, art. 5.1.c RGPD):
      </p>
      <ul className="legalList">
        <li>
          <strong>Identificación y cuenta:</strong> correo electrónico,
          identificador de Supabase Auth, hash de autenticación, fecha de
          creación y último acceso.
        </li>
        <li>
          <strong>Perfil público:</strong> nombre visible, handle, biografía,
          foto, ubicación declarada y enlaces que tú mismo añades.
        </li>
        <li>
          <strong>Actividad:</strong> eventos que creas o a los que te unes,
          clubs de los que eres miembro, mensajes directos, publicaciones en
          muros, seguidores, seguidos y bloqueos.
        </li>
        <li>
          <strong>Preferencias y consentimientos:</strong> ajustes de
          notificaciones, privacidad y preferencia, y el estado de tus
          consentimientos granulares (analítica, comunicaciones).
        </li>
        <li>
          <strong>Soporte:</strong> el contenido de los tickets que nos envíes
          y tu correo de contacto para responderlos.
        </li>
      </ul>

      <h3>3. Finalidades y bases jurídicas</h3>
      <ul className="legalList">
        <li>
          <strong>Prestar el servicio</strong> (ejecución del contrato, art.
          6.1.b RGPD): crear tu cuenta, mostrar eventos, procesar inscripciones
          y mensajes, aplicar tus bloqueos.
        </li>
        <li>
          <strong>Seguridad y prevención de abusos</strong> (interés legítimo,
          art. 6.1.f RGPD): registro de accesos, control de uso abusivo, respuesta
          a incidentes.
        </li>
        <li>
          <strong>Analítica de producto agregada</strong> (consentimiento, art.
          6.1.a RGPD): solo si activas el interruptor en Privacidad.
        </li>
        <li>
          <strong>Comunicaciones y novedades</strong> (consentimiento, art.
          6.1.a RGPD): solo si activas el interruptor de correos de marketing.
        </li>
        <li>
          <strong>Obligaciones legales</strong> (art. 6.1.c RGPD): conservación
          mínima para responder a requerimientos de autoridades competentes.
        </li>
      </ul>

      <h3>4. Plazos de conservación</h3>
      <p>
        Conservamos tus datos mientras tengas cuenta activa. Al eliminar tu
        cuenta, borramos tu perfil y contenido personal identificable en un
        plazo máximo de 30 días, salvo que una obligación legal exija una
        retención mayor (p. ej., registros mínimos de seguridad durante un
        máximo de 12 meses). Los tickets de soporte se conservan hasta 2 años
        para garantizar la trazabilidad del servicio, o menos si lo solicitas.
      </p>

      <h3>5. Destinatarios y encargados del tratamiento</h3>
      <p>
        No vendemos tus datos. Los compartimos estrictamente con los
        proveedores que nos prestan la infraestructura del servicio, cada uno
        bajo contrato de encargo conforme al art. 28 RGPD:
      </p>
      <ul className="legalList">
        <li>
          <strong>Supabase</strong> (autenticación, base de datos, almacenamiento
          de imágenes). Los datos se alojan dentro del Espacio Económico
          Europeo siempre que es posible.
        </li>
        <li>
          <strong>Resend</strong> (envío de correos transaccionales y, en su
          caso, soporte), únicamente cuando es necesario para entregar un
          email relacionado con tu cuenta o ticket.
        </li>
        <li>
          <strong>Proveedores de mapas y localización</strong>: cuando cargas
          el mapa en la app, se efectúa una consulta al proveedor del mapa.
        </li>
      </ul>
      <p>
        Si en algún momento un proveedor implica una transferencia internacional
        fuera del EEE, se realizará al amparo de cláusulas contractuales tipo
        de la Comisión Europea u otra garantía válida del art. 46 RGPD.
      </p>

      <h3>6. Tus derechos (arts. 15–22 RGPD)</h3>
      <ul className="legalList">
        <li>
          <strong>Acceso y portabilidad:</strong> puedes descargar todos tus
          datos en formato JSON desde Ajustes → Privacidad → "Descargar mis
          datos".
        </li>
        <li>
          <strong>Rectificación:</strong> puedes corregir tu perfil y
          preferencias en cualquier momento desde la propia app.
        </li>
        <li>
          <strong>Supresión ("derecho al olvido"):</strong> puedes eliminar tu
          cuenta desde Ajustes → Cuenta → Eliminar cuenta.
        </li>
        <li>
          <strong>Oposición y limitación:</strong> puedes oponerte al
          tratamiento basado en interés legítimo y desactivar los
          consentimientos granulares en Privacidad → Consentimiento y datos.
        </li>
        <li>
          <strong>Retirada del consentimiento:</strong> tan fácil como
          activarlo. Retirarlo no afecta a la licitud del tratamiento previo.
        </li>
        <li>
          <strong>Reclamación ante la autoridad de control:</strong> si
          consideras que no atendemos correctamente tus derechos, puedes
          reclamar ante la Agencia Española de Protección de Datos
          (www.aepd.es).
        </li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="settingsLink">
          {CONTACT_EMAIL}
        </a>
        . Responderemos en un plazo máximo de un mes (art. 12.3 RGPD).
      </p>

      <h3>7. Seguridad</h3>
      <p>
        Aplicamos medidas técnicas y organizativas proporcionadas al riesgo:
        cifrado en tránsito (TLS), credenciales bloqueadas mediante políticas
        RLS en la base de datos, aislamiento por usuario, registro de accesos,
        revisión periódica de dependencias y principio de mínimo privilegio en
        accesos internos.
      </p>

      <h3>8. Menores</h3>
      <p>
        {APP_NAME} está dirigido a personas mayores de 14 años (art. 7
        LOPDGDD). Si detectamos que una cuenta pertenece a un menor de esa
        edad, procederemos a cerrarla.
      </p>

      <h3>9. Cookies y almacenamiento local</h3>
      <p>
        La app utiliza almacenamiento local del dispositivo para guardar tu
        sesión y una copia de tus ajustes y así funcionar sin conexión. No
        usamos cookies de publicidad ni rastreo de terceros.
      </p>

      <h3>10. Cambios en esta política</h3>
      <p>
        Si actualizamos esta política de forma material, te avisaremos desde
        la propia app antes de que los cambios entren en vigor, para que puedas
        revisarlos y, si procede, retirar tus consentimientos.
      </p>

      <p className="settingsMuted">
        ¿Preguntas sobre privacidad? Escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="settingsLink">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}

function TermsOfService() {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>Términos y Condiciones de {APP_NAME}</h2>
      <p className="settingsMuted">Última actualización: {LAST_UPDATED}</p>

      <p>
        Estos términos regulan tu uso de {APP_NAME}. Al crear una cuenta o
        seguir utilizando el servicio aceptas estos términos. Si no estás de
        acuerdo, cierra la app y no la utilices.
      </p>

      <h3>1. Qué es {APP_NAME}</h3>
      <p>
        {APP_NAME} es una aplicación para descubrir, organizar y participar en
        quedadas de running, unirse a clubes, intercambiar mensajes con otros
        corredores y compartir actividad deportiva. El servicio se ofrece "tal
        cual", como un proyecto mantenido activamente y en continua evolución.
      </p>

      <h3>2. Cuenta de usuario</h3>
      <p>
        Para usar las funciones sociales necesitas una cuenta. Te comprometes
        a facilitar información veraz, mantenerla actualizada y no suplantar a
        otras personas. Debes tener al menos 14 años (art. 7 LOPDGDD) para
        registrarte.
      </p>
      <p>
        Eres responsable de mantener la confidencialidad de tus credenciales y
        de cualquier actividad realizada desde tu cuenta. Avísanos de
        inmediato si detectas un acceso no autorizado.
      </p>

      <h3>3. Contenido que publicas</h3>
      <p>
        Conservas la titularidad del contenido que publiques (perfil, fotos,
        eventos, mensajes, comentarios). Nos otorgas una licencia limitada,
        gratuita, mundial y no exclusiva para alojar, mostrar y distribuir ese
        contenido dentro del servicio, únicamente con el fin de prestártelo.
        Esta licencia termina cuando eliminas el contenido o tu cuenta, salvo
        por copias operativas o de seguridad que se borren con los ciclos
        técnicos habituales.
      </p>

      <h3>4. Normas de convivencia</h3>
      <p>
        Para que {APP_NAME} sea un espacio seguro, te comprometes a no:
      </p>
      <ul className="legalList">
        <li>acosar, amenazar, insultar o discriminar a otros usuarios;</li>
        <li>
          publicar contenido sexual explícito, violento, ilegal o que vulnere
          derechos de terceros;
        </li>
        <li>hacer spam, vender productos o servicios sin autorización;</li>
        <li>
          recolectar datos de otros usuarios de forma masiva ni intentar
          eludir los mecanismos de privacidad, bloqueo o moderación;
        </li>
        <li>
          suplantar a otras personas, clubs u organizaciones, ni falsear tu
          ubicación o identidad;
        </li>
        <li>
          distribuir malware, explotar vulnerabilidades o realizar ingeniería
          inversa de la app.
        </li>
      </ul>
      <p>
        Podemos eliminar contenido o suspender cuentas que incumplan estas
        normas. Cuando sea posible, avisaremos antes.
      </p>

      <h3>5. Bloqueos y denuncias</h3>
      <p>
        Puedes bloquear a cualquier usuario desde su perfil. Al bloquear,
        dejará de ver tu perfil, tu contenido y tus mensajes, y tú tampoco
        verás los suyos. Puedes revertirlo en Ajustes → Privacidad → Usuarios
        bloqueados. Para denunciar contenido abusivo, usa Ajustes → Contactar
        soporte.
      </p>

      <h3>6. Seguridad deportiva</h3>
      <p>
        Correr implica riesgos físicos. {APP_NAME} es una herramienta para
        coordinar quedadas, no una entidad organizadora. Cada participante
        asiste bajo su propia responsabilidad y debe valorar su estado físico,
        el terreno, el tráfico y las condiciones meteorológicas.
        {" "}{APP_NAME} no responde por lesiones, pérdidas o daños derivados
        de la participación en eventos coordinados a través de la app.
      </p>

      <h3>7. Disponibilidad del servicio</h3>
      <p>
        Intentamos mantener el servicio disponible de forma continua, pero no
        garantizamos que esté libre de interrupciones, fallos o cambios. Nos
        reservamos el derecho de modificar o suspender funcionalidades, con
        aviso previo cuando el cambio sea material.
      </p>

      <h3>8. Propiedad intelectual</h3>
      <p>
        La marca {APP_NAME}, el logotipo, la interfaz, los textos propios y el
        software son propiedad del equipo de {APP_NAME}. No puedes copiarlos,
        distribuirlos ni crear obras derivadas sin autorización por escrito.
      </p>

      <h3>9. Limitación de responsabilidad</h3>
      <p>
        En la máxima medida permitida por la ley aplicable, {APP_NAME} no será
        responsable de daños indirectos, lucro cesante, pérdida de datos ni
        perjuicios derivados de interacciones con otros usuarios. Nada en
        estos términos excluye o limita responsabilidades que no puedan
        excluirse legalmente (p. ej., por dolo o negligencia grave).
      </p>

      <h3>10. Finalización</h3>
      <p>
        Puedes cerrar tu cuenta en cualquier momento desde Ajustes → Cuenta →
        Eliminar cuenta. Podemos cerrar cuentas que incumplan reiteradamente
        estos términos o supongan un riesgo para otros usuarios.
      </p>

      <h3>11. Cambios en estos términos</h3>
      <p>
        Si modificamos estos términos de forma material, te avisaremos en la
        app antes de que los cambios entren en vigor. El uso continuado
        después de la notificación implica aceptación.
      </p>

      <h3>12. Ley aplicable y jurisdicción</h3>
      <p>
        Estos términos se rigen por la legislación española. Para cualquier
        controversia, las partes se someten a los juzgados y tribunales del
        domicilio del usuario cuando actúe como consumidor. Para usuarios
        profesionales, a los juzgados y tribunales del domicilio del
        responsable.
      </p>

      <p className="settingsMuted">
        ¿Dudas sobre estos términos? Escríbenos a{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="settingsLink">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </>
  );
}

export default function SettingsLegalPage({ mode = "privacy" }) {
  const navigate = useNavigate();
  const isPrivacy = mode === "privacy";

  return (
    <section className="page settingsSubpage">
      <div className="settingsSubpage__header">
        <button
          type="button"
          className="settingsSubpage__back"
          onClick={() => navigate(-1)}
          aria-label="Volver"
        >
          <BackIcon />
        </button>
        <div>
          <h1 className="settingsSubpage__title">
            {isPrivacy ? "Política de privacidad" : "Términos y condiciones"}
          </h1>
          <p className="settingsSubpage__subtitle">
            {isPrivacy
              ? "Cómo tratamos tus datos en " + APP_NAME + " y qué derechos tienes sobre ellos."
              : "Las reglas que nos damos para que " + APP_NAME + " sea un buen espacio."}
          </p>
        </div>
      </div>

      <article className="settingsCard legalDoc">
        {isPrivacy ? <PrivacyPolicy /> : <TermsOfService />}
      </article>
    </section>
  );
}
