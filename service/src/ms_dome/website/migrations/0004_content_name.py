from django.db import migrations, models


def name_existing_contents(apps, schema_editor):
    WebsiteContent = apps.get_model('website', 'WebsiteContent')
    for content in WebsiteContent.objects.order_by('created_at'):
        content.name = 'Snapshot'
        content.save(update_fields=['name'])


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0003_content_versions'),
    ]

    operations = [
        migrations.AddField(
            model_name='websitecontent',
            name='name',
            field=models.CharField(default='', max_length=255),
            preserve_default=False,
        ),
        migrations.RunPython(name_existing_contents, migrations.RunPython.noop),
    ]
