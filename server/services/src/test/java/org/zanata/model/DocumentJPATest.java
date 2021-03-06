package org.zanata.model;

import java.util.List;

import javax.persistence.EntityManager;

import org.dbunit.operation.DatabaseOperation;
import org.hibernate.Session;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.zanata.ZanataDbunitJpaTest;
import org.zanata.common.ContentType;
import org.zanata.common.LocaleId;
import org.zanata.dao.LocaleDAO;
import org.zanata.security.ZanataIdentity;

import static org.assertj.core.api.Assertions.assertThat;

public class DocumentJPATest extends ZanataDbunitJpaTest {

    private LocaleDAO localeDAO;
    HLocale en_US;
    HLocale de_DE;

    protected void prepareDBUnitOperations() {
        beforeTestOperations.add(new DataSetOperation(
                "org/zanata/test/model/ProjectsData.dbunit.xml",
                DatabaseOperation.CLEAN_INSERT));
        beforeTestOperations.add(new DataSetOperation(
                "org/zanata/test/model/LocalesData.dbunit.xml",
                DatabaseOperation.CLEAN_INSERT));
    }

    private void syncRevisions(HDocument doc, HTextFlow... textFlows) {
        int rev = doc.getRevision();
        syncRevisions(doc, rev, textFlows);
    }

    private void syncRevisions(HDocument doc, int revision,
            HTextFlow... textFlows) {
        doc.setRevision(revision);
        for (HTextFlow textFlow : textFlows) {
            textFlow.setRevision(revision);
        }
    }

    @BeforeClass
    public static void disableSecurity() {
        ZanataIdentity.setSecurityEnabled(false);
    }

    @Before
    public void beforeMethod() {
        localeDAO = new LocaleDAO((Session) em.getDelegate());
        en_US = localeDAO.findByLocaleId(LocaleId.EN_US);
        de_DE = localeDAO.findByLocaleId(new LocaleId("de"));
    }

    @Test
    public void traverseProjectGraph() throws Exception {
        EntityManager em = getEm();
        HProject project = em.find(HProject.class, 1l);
        assertThat(project).isNotNull();

        List<HProjectIteration> iterations = project.getProjectIterations();
        assertThat(iterations)
                .hasSize(3)
                .extracting(HProjectIteration::getId)
                .contains(1L, 2L, 900L);
    }

    @Test
    public void checkPositionsNotNull() throws Exception {
        EntityManager em = getEm();
        HProject project = em.find(HProject.class, 1l);
        assertThat(project).isNotNull();

        HDocument hdoc =
                new HDocument("fullpath", ContentType.TextPlain, en_US);
        hdoc.setProjectIteration(project.getProjectIterations().get(0));

        List<HTextFlow> textFlows = hdoc.getTextFlows();
        HTextFlow flow1 = new HTextFlow(hdoc, "textflow1", "some content");
        HTextFlow flow2 = new HTextFlow(hdoc, "textflow2", "more content");
        textFlows.add(flow1);
        textFlows.add(flow2);
        em.persist(hdoc);
        em.flush();
        // em.clear();
        // hdoc = em.find(HDocument.class, docId);
        em.refresh(hdoc);

        List<HTextFlow> textFlows2 = hdoc.getTextFlows();
        assertThat(textFlows2.size()).isEqualTo(2);
        flow1 = textFlows2.get(0);
        assertThat(flow1).isNotNull();
        flow2 = textFlows2.get(1);
        assertThat(flow2).isNotNull();

        // TODO: we should automate this...
        hdoc.incrementRevision();

        textFlows2.remove(flow1);
        flow1.setObsolete(true);
        syncRevisions(hdoc, flow1);

        // flow1.setPos(null);
        em.flush();
        em.refresh(hdoc);
        em.refresh(flow1);
        em.refresh(flow2);
        assertThat(hdoc.getTextFlows().size()).isEqualTo(1);
        flow2 = hdoc.getTextFlows().get(0);
        assertThat(flow2.getResId()).isEqualTo("textflow2");

        flow1 = hdoc.getAllTextFlows().get("textflow1");
        // assertThat(flow1.getPos(), nullValue());
        assertThat(flow1.isObsolete()).isTrue();
        assertThat(flow1.getRevision()).isEqualTo(2);
        flow2 = hdoc.getAllTextFlows().get("textflow2");
        // assertThat(flow1.getPos(), is(0));
        assertThat(flow2.isObsolete()).isFalse();
    }

    @SuppressWarnings("unchecked")
    @Test
    public void ensureHistoryOnTextFlow() {
        EntityManager em = getEm();
        HProject project = em.find(HProject.class, 1l);
        assertThat(project).isNotNull();

        HDocument hdoc =
                new HDocument("fullpath", ContentType.TextPlain, en_US);
        hdoc.setProjectIteration(project.getProjectIterations().get(0));

        List<HTextFlow> textFlows = hdoc.getTextFlows();
        HTextFlow flow1 = new HTextFlow(hdoc, "textflow3", "some content");
        HTextFlow flow2 = new HTextFlow(hdoc, "textflow4", "more content");
        textFlows.add(flow1);
        textFlows.add(flow2);
        em.persist(hdoc);
        em.flush();

        hdoc.incrementRevision();

        flow1.setContents("nwe content!");

        syncRevisions(hdoc, flow1);

        em.flush();

        HTextFlowTarget target = new HTextFlowTarget(flow1, de_DE);
        target.setContents("hello world");
        em.persist(target);
        em.flush();
        target.setContents("h2");
        em.flush();

        List<HTextFlowTargetHistory> hist =
                em.createQuery(
                        "from HTextFlowTargetHistory h where h.textFlowTarget =:target")
                        .setParameter("target", target).getResultList();
        assertThat(hist)
                .isNotNull()
                .isNotEmpty();
    }

}
